package com.theragift.service;

import com.theragift.dto.appointment.AppointmentRequest;
import com.theragift.dto.appointment.AppointmentSaveResponse;
import com.theragift.dto.recurring.GenerateOccurrencesResponse;
import com.theragift.dto.recurring.RecurringAppointmentRequest;
import com.theragift.dto.recurring.RecurringAppointmentResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.Client;
import com.theragift.entity.RecurringAppointment;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.ClientRepository;
import com.theragift.repository.RecurringAppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Sabit / tekrarlayan randevu kurallarını yönetir. Bu servis kendisi hiçbir
 * randevu YARATMAZ ve hiçbir çakışma kuralını tekrar yazmaz — occurrence
 * üretimi sırasında (generateNextOccurrences) her zaman AppointmentService'in
 * merkezi hasConflict()/create() metodları üzerinden geçer. Böylece "Bu slotu
 * kullan" veya normal "Yeni Randevu" akışıyla birebir aynı doğrulama kurallarına
 * tabi olur.
 */
@Service
@RequiredArgsConstructor
public class RecurringAppointmentService {

    private final RecurringAppointmentRepository recurringAppointmentRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;

    private static final int GENERATE_WINDOW_DAYS = 28; // "önümüzdeki 4 hafta"

    public List<RecurringAppointmentResponse> list(User psychologist, Long clientId) {
        List<RecurringAppointment> rules = clientId != null
                ? recurringAppointmentRepository.findByClientAndPsychologistOrderByCreatedAtDesc(
                        findClient(psychologist, clientId), psychologist)
                : recurringAppointmentRepository.findByPsychologistOrderByCreatedAtDesc(psychologist);
        return rules.stream().map(this::toResponse).toList();
    }

    @Transactional
    public RecurringAppointmentResponse create(User psychologist, RecurringAppointmentRequest request) {
        Client client = findClient(psychologist, request.getClientId());

        if (request.getDayOfWeek() == null) {
            throw new ApiException("Gün seçimi zorunludur.", HttpStatus.BAD_REQUEST);
        }
        if (request.getRecurrenceType() == null) {
            throw new ApiException("Tekrar sıklığı seçimi zorunludur.", HttpStatus.BAD_REQUEST);
        }
        if (request.getStartTime() == null || request.getEndTime() == null || !request.getStartTime().isBefore(request.getEndTime())) {
            throw new ApiException("Bitiş saati başlangıç saatinden sonra olmalıdır.", HttpStatus.BAD_REQUEST);
        }

        BigDecimal fee = request.getFeeAmount() != null ? request.getFeeAmount() : client.getDefaultSessionFee();

        RecurringAppointment rule = RecurringAppointment.builder()
                .client(client)
                .psychologist(psychologist)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .sessionType(request.getSessionType() != null ? request.getSessionType() : client.getSessionTypePreference())
                .feeAmount(fee)
                .paymentStatusDefault(request.getPaymentStatusDefault() != null ? request.getPaymentStatusDefault() : PaymentStatus.UNPAID)
                .recurrenceType(request.getRecurrenceType())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .endDate(request.getEndDate())
                .active(request.getActive() == null || request.getActive())
                .note(request.getNote())
                .build();

        recurringAppointmentRepository.save(rule);
        return toResponse(rule);
    }

    @Transactional
    public RecurringAppointmentResponse update(User psychologist, Long id, RecurringAppointmentRequest request) {
        RecurringAppointment rule = findRule(psychologist, id);

        if (request.getDayOfWeek() != null) rule.setDayOfWeek(request.getDayOfWeek());
        if (request.getStartTime() != null) rule.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) rule.setEndTime(request.getEndTime());
        if (request.getSessionType() != null) rule.setSessionType(request.getSessionType());
        if (request.getFeeAmount() != null) rule.setFeeAmount(request.getFeeAmount());
        if (request.getPaymentStatusDefault() != null) rule.setPaymentStatusDefault(request.getPaymentStatusDefault());
        if (request.getRecurrenceType() != null) rule.setRecurrenceType(request.getRecurrenceType());
        if (request.getStartDate() != null) rule.setStartDate(request.getStartDate());
        rule.setEndDate(request.getEndDate());
        if (request.getActive() != null) rule.setActive(request.getActive());
        if (request.getNote() != null) rule.setNote(request.getNote());

        if (!rule.getStartTime().isBefore(rule.getEndTime())) {
            throw new ApiException("Bitiş saati başlangıç saatinden sonra olmalıdır.", HttpStatus.BAD_REQUEST);
        }

        recurringAppointmentRepository.save(rule);
        return toResponse(rule);
    }

    @Transactional
    public void delete(User psychologist, Long id) {
        RecurringAppointment rule = findRule(psychologist, id);
        recurringAppointmentRepository.delete(rule);
    }

    /**
     * "Önümüzdeki 4 hafta randevuları oluştur" aksiyonu.
     *
     * V2.2A.1 ile netleştirilen akış:
     * 1. Kuralın gününe/sıklığına göre bugünden itibaren 4 haftalık pencereye
     *    düşen occurrence tarihleri hesaplanır (computeOccurrenceDates).
     * 2. Her occurrence için ÖNCE AppointmentService.hasConflict() (SERT engel)
     *    kontrol edilir — aynı saatte aktif (CANCELLED olmayan) bir randevu
     *    varsa o occurrence "blocker" olarak raporlanır ve `overrideWarnings`
     *    ne olursa olsun ASLA oluşturulmaz.
     * 3. Blocker olmayan occurrence'lar için mola/mesai dışı/danışan uygunluğu
     *    gibi YUMUŞAK uyarılar hesaplanır (AppointmentService.computeWarningsPublic).
     *    - Hiç warning yoksa: occurrence'lar DİREKT oluşturulur.
     *    - Warning varsa VE overrideWarnings=false ise: HİÇBİR occurrence
     *      oluşturulmaz, requiresConfirmation=true ile warning listesi
     *      döndürülür — frontend kullanıcıya onay modalı göstermeli.
     *    - Warning varsa VE overrideWarnings=true ise: occurrence'lar oluşturulur
     *      (kullanıcı zaten onayladı).
     */
    @Transactional
    public GenerateOccurrencesResponse generateNextOccurrences(User psychologist, Long ruleId, boolean overrideWarnings) {
        RecurringAppointment rule = findRule(psychologist, ruleId);
        if (!rule.isActive()) {
            throw new ApiException("Pasif bir sabit randevu kuralı için randevu üretilemez.", HttpStatus.BAD_REQUEST);
        }

        LocalDate today = LocalDate.now();
        LocalDate rangeEnd = today.plusDays(GENERATE_WINDOW_DAYS);

        List<LocalDate> occurrenceDates = computeOccurrenceDates(rule, today, rangeEnd);

        List<GenerateOccurrencesResponse.OccurrenceIssue> blockers = new ArrayList<>();
        List<GenerateOccurrencesResponse.OccurrenceIssue> warnings = new ArrayList<>();
        List<LocalDate> creatableDates = new ArrayList<>();

        for (LocalDate date : occurrenceDates) {
            if (appointmentService.hasConflict(psychologist, date, rule.getStartTime(), rule.getEndTime())) {
                blockers.add(GenerateOccurrencesResponse.OccurrenceIssue.builder()
                        .date(date).startTime(rule.getStartTime()).endTime(rule.getEndTime())
                        .message("Bu saatte zaten aktif bir randevu var — occurrence oluşturulamaz.")
                        .build());
                continue;
            }

            List<String> occWarnings = appointmentService.computeWarningsPublic(
                    psychologist, rule.getClient(), date, rule.getStartTime(), rule.getEndTime());
            for (String w : occWarnings) {
                warnings.add(GenerateOccurrencesResponse.OccurrenceIssue.builder()
                        .date(date).startTime(rule.getStartTime()).endTime(rule.getEndTime())
                        .message(w)
                        .build());
            }
            creatableDates.add(date);
        }

        // Warning varsa ve kullanıcı henüz onaylamadıysa: HİÇBİR randevu oluşturmadan
        // onay iste. Bu, "uyarı gösterip yine de sessizce oluşturma" hatasının düzeltmesidir.
        if (!warnings.isEmpty() && !overrideWarnings) {
            return GenerateOccurrencesResponse.builder()
                    .requiresConfirmation(true)
                    .createdCount(0)
                    .createdAppointments(List.of())
                    .blockers(blockers)
                    .warnings(warnings)
                    .build();
        }

        List<com.theragift.dto.appointment.AppointmentResponse> created = new ArrayList<>();
        for (LocalDate date : creatableDates) {
            AppointmentRequest req = new AppointmentRequest();
            req.setClientId(rule.getClient().getId());
            req.setAppointmentDate(date);
            req.setStartTime(rule.getStartTime());
            req.setEndTime(rule.getEndTime());
            req.setSessionType(rule.getSessionType());
            req.setSessionFee(rule.getFeeAmount());
            req.setPaymentStatus(rule.getPaymentStatusDefault());
            // Warning'ler zaten yukarıda ya hiç yoktu ya da kullanıcı tarafından
            // onaylandı (overrideWarnings=true) — bu yüzden burada create() çağrısı
            // her zaman overrideWarnings=true ile yapılır. Blocker (çakışma) kontrolü
            // zaten yukarıda yapıldığı ve creatableDates'e blocker'lı tarihler hiç
            // eklenmediği için create() içindeki checkConflict() burada tetiklenmez.
            req.setOverrideWarnings(true);

            AppointmentSaveResponse saveResponse = appointmentService.create(psychologist, req);
            created.add(saveResponse.getAppointment());

            // Bu occurrence'ı kurala bağla — sadece "kuralı pasifleştirince gelecekteki
            // randevuları da iptal et" gibi opsiyonel toplu işlemler için kullanılır,
            // AppointmentService.create()'in kendi davranışını etkilemez.
            Long createdId = saveResponse.getAppointment().getId();
            appointmentRepository.findById(createdId).ifPresent(a -> {
                a.setRecurringAppointment(rule);
                appointmentRepository.save(a);
            });
        }

        return GenerateOccurrencesResponse.builder()
                .requiresConfirmation(false)
                .createdCount(created.size())
                .createdAppointments(created)
                .blockers(blockers)
                .warnings(warnings)
                .build();
    }

    /**
     * "Pasif yap" sonrası opsiyonel ikinci adım: bu kurala bağlı, GELECEKTEKİ
     * (bugün dahil, bugünden önce değil) ve hâlâ SCHEDULED durumda olan
     * randevuları CANCELLED yapar. Geçmiş randevulara, COMPLETED/NO_SHOW/zaten
     * CANCELLED olanlara asla dokunmaz. Kuralın kendisini etkilemez (zaten
     * pasifleştirilmiş olmalı, ama bu metod kuralın active durumunu kontrol
     * etmez — psikolog isterse aktif bir kural için de kullanabilir).
     */
    @Transactional
    public int cancelFutureAppo