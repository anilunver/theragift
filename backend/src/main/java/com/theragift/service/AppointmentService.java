package com.theragift.service;

import com.theragift.dto.appointment.AppointmentRequest;
import com.theragift.dto.appointment.AppointmentResponse;
import com.theragift.dto.appointment.AppointmentSaveResponse;
import com.theragift.dto.appointment.PaymentUpdateRequest;
import com.theragift.entity.Appointment;
import com.theragift.entity.AuditLog;
import com.theragift.entity.Client;
import com.theragift.entity.User;
import com.theragift.entity.WorkingHour;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.AuditLogRepository;
import com.theragift.repository.ClientRepository;
import com.theragift.repository.WorkingHourRepository;
import com.theragift.util.AvailabilityTextParser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final AuditLogRepository auditLogRepository;
    private final WorkingHourRepository workingHourRepository;

    public List<AppointmentResponse> getAll(User psychologist) {
        return appointmentRepository.findByPsychologistOrderByAppointmentDateDescStartTimeDesc(psychologist)
                .stream().map(a -> toResponse(a, psychologist)).toList();
    }

    public AppointmentResponse getById(User psychologist, Long id) {
        return toResponse(findAppointment(psychologist, id), psychologist);
    }

    public List<AppointmentResponse> getWeek(User psychologist, LocalDate weekStart) {
        LocalDate start = weekStart != null ? weekStart : LocalDate.now();
        LocalDate end = start.plusDays(6);
        return appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end)
                .stream().map(a -> toResponse(a, psychologist)).toList();
    }

    /**
     * Randevu oluşturma — merkezi validation akışı.
     * 1) Çakışma kontrolü (checkConflict) HER ZAMAN çalışır ve engelleyicidir (409).
     *    Bu kontrol; normal "Yeni Randevu" ekranından, öneri ekranından "Bu slotu
     *    kullan" ile ya da başka bir yoldan gelsin, TEK bu metod üzerinden geçer.
     *    Yani hiçbir akış bu kontrolü bypass edemez.
     * 2) Sonrasında "yumuşak" uyarılar (mola saati / mesai dışı / danışan uygunluğu
     *    dışı) hesaplanır. Bunlar engellemez; overrideWarnings=false ise randevu
     *    KAYDEDİLMEDEN uyarı listesiyle birlikte döner, kullanıcı onaylayıp tekrar
     *    (overrideWarnings=true) gönderirse randevu oluşturulur.
     */
    @Transactional
    public AppointmentSaveResponse create(User psychologist, AppointmentRequest request) {
        Client client = clientRepository.findByIdAndPsychologist(request.getClientId(), psychologist)
                .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));

        // Sert kural: çakışma — asla bypass edilemez.
        checkConflict(psychologist, request.getAppointmentDate(), request.getStartTime(), request.getEndTime(), null);

        List<String> warnings = computeWarnings(psychologist, client, request.getAppointmentDate(),
                request.getStartTime(), request.getEndTime());

        if (!warnings.isEmpty() && !request.isOverrideWarnings()) {
            return AppointmentSaveResponse.builder()
                    .appointment(null)
                    .warnings(warnings)
                    .requiresConfirmation(true)
                    .build();
        }

        BigDecimal fee = request.getSessionFee() != null ? request.getSessionFee() : client.getDefaultSessionFee();

        Appointment appointment = Appointment.builder()
                .client(client)
                .psychologist(psychologist)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .sessionType(request.getSessionType())
                .status(request.getStatus() != null ? request.getStatus() : AppointmentStatus.SCHEDULED)
                .notes(request.getNotes())
                .sessionFee(fee)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.UNPAID)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : client.getDefaultPaymentMethod())
                .paymentDueDate(request.getPaymentDueDate())
                .remainingAmount(fee)
                .build();

        appointmentRepository.save(appointment);
        logAudit(psychologist, "APPOINTMENT_CREATED", "Appointment", appointment.getId());

        return AppointmentSaveResponse.builder()
                .appointment(toResponse(appointment, psychologist))
                .warnings(List.of())
                .requiresConfirmation(false)
                .build();
    }

    @Transactional
    public AppointmentResponse update(User psychologist, Long id, AppointmentRequest request) {
        Appointment appointment = findAppointment(psychologist, id);

        LocalDate date = request.getAppointmentDate() != null ? request.getAppointmentDate() : appointment.getAppointmentDate();
        var start = request.getStartTime() != null ? request.getStartTime() : appointment.getStartTime();
        var end = request.getEndTime() != null ? request.getEndTime() : appointment.getEndTime();

        // Aynı merkezi çakışma kontrolü — düzenlemede de bypass edilemez.
        checkConflict(psychologist, date, start, end, appointment.getId());

        if (request.getClientId() != null) {
            Client client = clientRepository.findByIdAndPsychologist(request.getClientId(), psychologist)
                    .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));
            appointment.setClient(client);
        }
        appointment.setAppointmentDate(date);
        appointment.setStartTime(start);
        appointment.setEndTime(end);
        if (request.getSessionType() != null) appointment.setSessionType(request.getSessionType());
        if (request.getStatus() != null) appointment.setStatus(request.getStatus());
        if (request.getNotes() != null) appointment.setNotes(request.getNotes());
        if (request.getSessionFee() != null) appointment.setSessionFee(request.getSessionFee());
        if (request.getPaymentStatus() != null) appointment.setPaymentStatus(request.getPaymentStatus());
        if (request.getPaymentMethod() != null) appointment.setPaymentMethod(request.getPaymentMethod());
        if (request.getPaymentDueDate() != null) appointment.setPaymentDueDate(request.getPaymentDueDate());

        appointmentRepository.save(appointment);
        logAudit(psychologist, "APPOINTMENT_UPDATED", "Appointment", appointment.getId());
        return toResponse(appointment, psychologist);
    }

    @Transactional
    public void delete(User psychologist, Long id) {
        Appointment appointment = findAppointment(psychologist, id);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        logAudit(psychologist, "APPOINTMENT_CANCELLED", "Appointment", appointment.getId());
    }

    @Transactional
    public AppointmentResponse updatePayment(User psychologist, Long id, PaymentUpdateRequest request) {
        Appointment appointment = findAppointment(psychologist, id);

        if (request.getPaymentMethod() != null) appointment.setPaymentMethod(request.getPaymentMethod());
        if (request.getPaymentDate() != null) appointment.setPaymentDate(request.getPaymentDate());
        if (request.getPaymentDueDate() != null) appointment.setPaymentDueDate(request.getPaymentDueDate());
        if (request.getPaymentNote() != null) appointment.setPaymentNote(request.getPaymentNote());

        PaymentStatus newStatus = request.getPaymentStatus() != null ? request.getPaymentStatus() : appointment.getPaymentStatus();
        appointment.setPaymentStatus(newStatus);

        BigDecimal fee = appointment.getSessionFee() != null ? appointment.getSessionFee() : BigDecimal.ZERO;
        BigDecimal requestedPaid = request.getPaidAmount() != null ? request.getPaidAmount() : appointment.getPaidAmount();
        if (requestedPaid == null) requestedPaid = BigDecimal.ZERO;
        if (requestedPaid.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Ödenen tutar negatif olamaz.", HttpStatus.BAD_REQUEST);
        }
        if (requestedPaid.compareTo(fee) > 0) {
            throw new ApiException("Ödenen tutar seans ücretinden fazla olamaz.", HttpStatus.BAD_REQUEST);
        }

        // Ödeme durumuna göre ödenen/kalan tutarı tutarlı hale getir.
        BigDecimal paid;
        BigDecimal remaining;
        switch (newStatus) {
            case PAID -> {
                paid = fee;
                remaining = BigDecimal.ZERO;
            }
            case UNPAID, PAY_LATER -> {
                paid = BigDecimal.ZERO;
                remaining = fee;
            }
            case FREE, PACKAGE_USED -> {
                paid = BigDecimal.ZERO;
                remaining = BigDecimal.ZERO;
            }
            case CANCELLED -> {
                // V2.2A.3: "İptal Edildi" seçilince seans hiç gerçekleşmemiş kabul
                // edilir — ne ödenen ne kalan tutar sayılır (girilen tutar yok sayılır).
                paid = BigDecimal.ZERO;
                remaining = BigDecimal.ZERO;
            }
            case PARTIAL_PAID -> {
                if (requestedPaid.compareTo(BigDecimal.ZERO) <= 0 || requestedPaid.compareTo(fee) >= 0) {
                    throw new ApiException("Kısmi ödeme tutarı 0 ile seans ücreti arasında olmalıdır.", HttpStatus.BAD_REQUEST);
                }
                paid = requestedPaid;
                remaining = fee.subtract(paid);
            }
            case NO_SHOW -> {
                // V2.2A.3: "Gelmedi" MVP kuralı gereği non-billable — ücretlendirme yok.
                paid = BigDecimal.ZERO;
                remaining = BigDecimal.ZERO;
            }
            default -> { // tanımsız durumlar: kullanıcının girdiği tutara güven
                paid = requestedPaid;
                remaining = fee.subtract(paid).max(BigDecimal.ZERO);
            }
        }

        appointment.setPaidAmount(paid);
        appointment.setRemainingAmount(remaining);

        // V2.2A.3: PaymentStatus.CANCELLED/NO_SHOW seçilmesi artık randevunun
        // GERÇEK durumunu (AppointmentStatus) da senkronize eder — daha önce
        // sadece ödeme durumu değişiyor, randevu SCHEDULED kalmaya devam
        // ediyordu; bu yüzden kayıt Payments'taki "İptal Edilenler" / "Gelmeyenler"
        // sekmelerine (AppointmentStatus'a göre filtrelenen) hiç düşmüyordu.
        if (newStatus == PaymentStatus.CANCELLED) {
            appointment.setStatus(AppointmentStatus.CANCELLED);
        } else if (newStatus == PaymentStatus.NO_SHOW) {
            appointment.setStatus(AppointmentStatus.NO_SHOW);
        }

        appointmentRepository.save(appointment);
        logAudit(psychologist, "PAYMENT_UPDATED", "Appointment", appointment.getId());
        return toResponse(appointment, psychologist);
    }

    /**
     * checkConflict() ile BİREBİR AYNI kuralı uygulayan, dışarıya açık (public)
     * sürüm. RecurringAppointmentService gibi diğer servislerin, sabit randevu
     * occurrence'ı oluşturmadan önce merkezi çakışma mantığını tekrar
     * yazmadan (duplication olmadan) kullanabilmesi için eklenmiştir.
     * CANCELLED randevular burada da çakışma sayılmaz.
     */
    public boolean hasConflict(User psychologist, LocalDate date, LocalTime start, LocalTime end) {
        List<Appointment> sameDay = appointmentRepository.findByPsychologistAndAppointmentDate(psychologist, date);
        return sameDay.stream().anyMatch(a -> a.getStatus() != AppointmentStatus.CANCELLED
                && start.isBefore(a.getEndTime()) && end.isAfter(a.getStartTime()));
    }

    /**
     * computeWarnings() metodunun dışarıya açık sürümü. Sabit randevu üretiminde
     * (RecurringAppointmentService) her occurrence için bilgilendirme amaçlı
     * kullanılır — occurrence'ı engellemez, sadece rapora eklenir.
     */
    public List<String> computeWarningsPublic(User psychologist, Client client, LocalDate date, LocalTime start, LocalTime end) {
        return computeWarnings(psychologist, client, date, start, end);
    }

    /**
     * Sert kural: aynı gün/saat aralığında CANCELLED olmayan başka bir randevu varsa
     * engelle. SCHEDULED / COMPLETED / NO_SHOW aktif kayıt sayılır ve çakışma
     * mantığında dikkate alınır; sadece CANCELLED hariç tutulur.
     */
    private void checkConflict(User psychologist, LocalDate date, LocalTime start, LocalTime end, Long excludeId) {
        List<Appointment> sameDay = appointmentRepository.findByPsychologistAndAppointmentDate(psychologist, date);
        for (Appointment a : sameDay) {
            if (excludeId != null && a.getId().equals(excludeId)) continue;
            if (a.getStatus() == AppointmentStatus.CANCELLED) continue;
            boolean overlap = start.isBefore(a.getEndTime()) && end.isAfter(a.getStartTime());
            if (overlap) {
                throw new ApiException("Bu saat aralığında zaten bir randevu var (" + a.getStartTime() + " - " + a.getEndTime() + ")", HttpStatus.CONFLICT);
            }
        }
    }

    /**
     * Yumuşak uyarılar: mola saati, mesai dışı, danışan uygunluğu dışı.
     * Hiçbiri engellemez, sadece kullanıcıya bilgi verir.
     */
    private List<String> computeWarnings(User psychologist, Client client, LocalDate date, LocalTime start, LocalTime end) {
        List<String> warnings = new ArrayList<>();
        DayOfWeek dow = date.getDayOfWeek();
        List<WorkingHour> dayHours = workingHourRepository.findByPsychologistAndDayOfWeekAndActiveTrue(psychologist, dow);

        boolean withinAnyWorkingHour = dayHours.stream()
                .anyMatch(wh -> !start.isBefore(wh.getStartTime()) && !end.isAfter(wh.getEndTime()));
        if (!withinAnyWorkingHour) {
            warnings.add("Bu randevu psikoloğun tanımlı mesai saatleri dışında. Yine de oluşturmak istiyor musunuz?");
        }

        boolean duringBreak = dayHours.stream().anyMatch(wh ->
                wh.getBreakStartTime() != null && wh.getBreakEndTime() != null
                        && start.isBefore(wh.getBreakEndTime()) && end.isAfter(wh.getBreakStartTime()));
        if (duringBreak) {
            warnings.add("Bu randevu psikoloğun mola saatine denk geliyor. Yine de oluşturmak istiyor musunuz?");
        }

        if (isOutsideClientAvailability(client, dow, start, end)) {
            warnings.add("Bu saat danışanın belirttiği uygunluk dışında. Yine de oluşturmak istiyor musunuz?");
        }

        return warnings;
    }

    private boolean isOutsideClientAvailability(Client client, DayOfWeek dow, LocalTime start, LocalTime end) {
        String notes = client.getAvailabilityNotes();
        if (notes == null || notes.isBlank()) return false;

        List<DayOfWeek> preferredDays = AvailabilityTextParser.extractPreferredDays(notes);
        if (!preferredDays.isEmpty() && !preferredDays.contains(dow)) {
            return true;
        }

        AvailabilityTextParser.TimeRange range = AvailabilityTextParser.extractPreferredTimeRange(notes);
        if (range != null && !range.contains(start, end)) {
            return true;
        }

        return false;
    }

    /**
     * Takvimde "mesai dışı" / mola etiketi gösterebilmek için randevunun
     * psikoloğun tanımlı çalışma saatleriyle uyumlu olup olmadığını hesaplar.
     */
    private boolean computeOutOfWorkingHours(User psychologist, LocalDate date, LocalTime start, LocalTime end) {
        List<WorkingHour> dayHours = workingHourRepository.findByPsychologistAndDayOfWeekAndActiveTrue(psychologist, date.getDayOfWeek());
        if (dayHours.isEmpty()) return true;
        return dayHours.stream().noneMatch(wh -> !start.isBefore(wh.getStartTime()) && !end.isAfter(wh.getEndTime()));
    }

    private void logAudit(User user, String action, String entityType, Long entityId) {
        auditLogRepository.save(AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .build());
    }

    private Appointment findAppointment(User psychologist, Long id) {
        return appointmentRepository.findByIdAndPsychologist(id, psychologist)
                .orElseThrow(() -> new ApiException("Randevu bulunamadı", HttpStatus.NOT_FOUND));
    }

    private AppointmentResponse toResponse(Appointment a, User psychologist) {
        boolean outOfHours = computeOutOfWorkingHours(psychologist, a.getAppointmentDate(), a.getStartTime(), a.getEndTime());
        return AppointmentResponse.builder()
                .id(a.getId())
                .clientId(a.getClient().getId())
                .clientFullName(a.getClient().getFirstName() + " " + a.getClient().getLastName())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .sessionType(a.getSessionType().name())
                .status(a.getStatus().name())
                .notes(a.getNotes())
                .sessionFee(a.getSessionFee())
                .paymentStatus(a.getPaymentStatus().name())
                .paymentMethod(a.getPaymentMethod() != null ? a.getPaymentMethod().name() : null)
                .paidAmount(a.getPaidAmount())
                .remainingAmount(a.getRemainingAmount())
                .paymentDate(a.getPaymentDate())
                .paymentDueDate(a.getPaymentDueDate())
                .paymentNote(a.getPaymentNote())
                .outOfWorkingHours(outOfHours)
                .build();
    }
}
