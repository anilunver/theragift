package com.theragift.service;

import com.theragift.dto.client.ClientRequest;
import com.theragift.dto.client.ClientResponse;
import com.theragift.dto.client.ClientStatusChangeResponse;
import com.theragift.dto.client.FutureAppointmentsCountResponse;
import com.theragift.dto.client.PaymentSummaryResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.Client;
import com.theragift.entity.PsychologistProfile;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.ClientRepository;
import com.theragift.repository.PsychologistProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;
    private final ActivityLogService activityLogService;

    public List<ClientResponse> getAll(User psychologist) {
        return clientRepository.findByPsychologistOrderByCreatedAtDesc(psychologist)
                .stream().map(this::toResponse).toList();
    }

    public ClientResponse getById(User psychologist, Long id) {
        Client client = findClient(psychologist, id);
        return toResponse(client);
    }

    /**
     * V2.2D: Yeni danışan eklenirken varsayılan ücret/seans türü/ödeme yöntemi
     * boş bırakılırsa psikoloğun Klinik/Pratik Ayarları'ndaki (PsychologistProfile)
     * varsayılanlarına düşülür. Bu sadece bir GÜVENLİK AĞIDIR — asıl önizleme/otomatik
     * doldurma frontend'de (Yeni Danışan formu açılırken) yapılır; psikolog formda
     * bu değerleri her zaman manuel değiştirebilir.
     */
    @Transactional
    public ClientResponse create(User psychologist, ClientRequest request) {
        PsychologistProfile profile = psychologistProfileRepository.findByUser(psychologist).orElse(null);

        BigDecimal defaultFee = request.getDefaultSessionFee() != null
                ? request.getDefaultSessionFee()
                : (profile != null ? profile.getDefaultSessionFee() : null);
        var sessionTypePref = request.getSessionTypePreference() != null
                ? request.getSessionTypePreference()
                : (profile != null ? profile.getDefaultSessionType() : null);
        var paymentMethod = request.getDefaultPaymentMethod() != null
                ? request.getDefaultPaymentMethod()
                : (profile != null ? profile.getDefaultPaymentMethod() : null);

        Client client = Client.builder()
                .psychologist(psychologist)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .sessionTypePreference(sessionTypePref)
                .availabilityNotes(request.getAvailabilityNotes())
                .defaultSessionFee(defaultFee)
                .defaultPaymentMethod(paymentMethod)
                .notes(request.getNotes())
                .active(request.getActive() == null || request.getActive())
                .build();
        clientRepository.save(client);
        // V2.3: Activity Log — kısa, operasyonel bir kayıt. Danışanın notu/
        // klinik bilgisi değil, sadece adı yazılır.
        activityLogService.log(psychologist, "CLIENT_CREATED", "CLIENT", client.getId(),
                client.getFirstName() + " " + client.getLastName() + " danışan olarak eklendi.");
        return toResponse(client);
    }

    @Transactional
    public ClientResponse update(User psychologist, Long id, ClientRequest request) {
        Client client = findClient(psychologist, id);

        if (request.getFirstName() != null) client.setFirstName(request.getFirstName());
        if (request.getLastName() != null) client.setLastName(request.getLastName());
        client.setPhone(request.getPhone());
        client.setEmail(request.getEmail());
        client.setSessionTypePreference(request.getSessionTypePreference());
        client.setAvailabilityNotes(request.getAvailabilityNotes());
        client.setDefaultSessionFee(request.getDefaultSessionFee());
        client.setDefaultPaymentMethod(request.getDefaultPaymentMethod());
        client.setNotes(request.getNotes());
        if (request.getActive() != null) client.setActive(request.getActive());

        clientRepository.save(client);
        return toResponse(client);
    }

    @Transactional
    public void delete(User psychologist, Long id) {
        Client client = findClient(psychologist, id);
        client.setActive(false);
        clientRepository.save(client);
    }

    /**
     * V2.2D.1: Danışanı pasif yapmadan ÖNCE, kullanıcıya onay sorusu göstermek
     * için gelecekteki (bugün dahil, bugünden sonraki) hâlâ SCHEDULED randevu
     * sayısını döner. Bu SADECE bir ön kontrol/bilgi endpoint'idir — hiçbir
     * şeyi değiştirmez.
     */
    public FutureAppointmentsCountResponse getFutureScheduledAppointmentsCount(User psychologist, Long id) {
        Client client = findClient(psychologist, id);
        List<Appointment> future = appointmentRepository.findByClientAndStatusAndAppointmentDateGreaterThanEqual(
                client, AppointmentStatus.SCHEDULED, LocalDate.now());
        return FutureAppointmentsCountResponse.builder().count(future.size()).build();
    }

    /**
     * V2.2D: Danışanı aktif/pasif yapmak için özel, niyeti net bir endpoint.
     * ÖNEMLİ: bu asla gerçek bir silme İŞLEMİ DEĞİLDİR — geçmiş randevular,
     * notlar ve ödeme kayıtları hiç etkilenmez, sadece `active` bayrağı değişir.
     * Pasif bir danışan tekrar aktif yapılabilir (aynı endpoint ile).
     *
     * V2.2D.1 EKLENDİ: Danışan pasif yapılırken (active=false) ve
     * cancelFutureAppointments=true gönderildiyse, SADECE bugünden sonraki
     * (bugün dahil) hâlâ SCHEDULED olan randevular CANCELLED yapılır. Geçmiş,
     * COMPLETED, NO_SHOW veya zaten CANCELLED randevulara asla dokunulmaz.
     * Danışan tekrar AKTİF yapılırken (active=true) bu parametre tamamen
     * yok sayılır — sadece pasif yapma akışında anlamlıdır.
     */
    @Transactional
    public ClientStatusChangeResponse updateStatus(User psychologist, Long id, boolean active, boolean cancelFutureAppointments) {
        Client client = findClient(psychologist, id);
        boolean wasActive = client.isActive();
        client.setActive(active);
        clientRepository.save(client);

        int cancelledCount = 0;
        if (!active && cancelFutureAppointments) {
            List<Appointment> future = appointmentRepository.findByClientAndStatusAndAppointmentDateGreaterThanEqual(
                    client, AppointmentStatus.SCHEDULED, LocalDate.now());
            for (Appointment a : future) {
                a.setStatus(AppointmentStatus.CANCELLED);
            }
            appointmentRepository.saveAll(future);
            cancelledCount = future.size();
        }

        // V2.3: Activity Log — sadece PASİF yapma olayı loglanır (aktif yapma
        // MVP'de öncelikli listede değil, gürültü azaltmak için atlanır).
        if (wasActive && !active) {
            activityLogService.log(psychologist, "CLIENT_DEACTIVATED", "CLIENT", client.getId(),
                    client.getFirstName() + " " + client.getLastName() + " pasif yapıldı.");
        }

        return ClientStatusChangeResponse.builder()
                .client(toResponse(client))
                .cancelledAppointmentsCount(cancelledCount)
                .build();
    }

    /**
     * V2.2A.3: AppointmentStatus = CANCELLED veya NO_SHOW olan randevular
     * danışan ödeme özetindeki toplam ciro/tahsilat/borç hesaplarına dahil
     * edilmez (non-billable). Bu randevular listede ("appointments" / lines)
     * görünürlük için hâlâ yer alır (geçmişi görmek isteyebilir), ancak
     * kalan tutarları 0 olarak gösterilir ve toplamlara/borç sayaçlarına
     * hiç katılmazlar.
     */
    public PaymentSummaryResponse getPaymentSummary(User psychologist, Long id) {
        Client client = findClient(psychologist, id);
        List<Appointment> appointments = appointmentRepository.findByClient(client);

        BigDecimal totalFee = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalRemaining = BigDecimal.ZERO;
        int unpaidCount = 0;
        int overdueCount = 0;
        int billableCount = 0;

        List<PaymentSummaryResponse.AppointmentPaymentLine> lines = appointments.stream().map(a -> {
            boolean billable = isBillableAppointment(a);
            BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
            BigDecimal paid = billable ? (a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal remaining = billable
                    ? (a.getRemainingAmount() != null ? a.getRemainingAmount() : fee.subtract(paid))
                    : BigDecimal.ZERO;
            return PaymentSummaryResponse.AppointmentPaymentLine.builder()
                    .appointmentId(a.getId())
                    .appointmentDate(a.getAppointmentDate().toString())
                    .sessionFee(fee)
                    .paymentStatus(a.getPaymentStatus().name())
                    .paidAmount(paid)
                    .remainingAmount(remaining)
                    .build();
        }).toList();

        for (Appointment a : appointments) {
            if (!isBillableAppointment(a)) {
                // CANCELLED / NO_SHOW: seans gerçekleşmedi — ciro/borç toplamlarına
                // ve tahsil edilmeyen/geciken sayaçlarına hiç eklenmez.
                continue;
            }
            billableCount++;
            BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
            BigDecimal paid = a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal remaining = a.getRemainingAmount() != null ? a.getRemainingAmount() : fee.subtract(paid);
            totalFee = totalFee.add(fee);
            totalPaid = totalPaid.add(paid);
            totalRemaining = totalRemaining.add(remaining);

            if (a.getPaymentStatus() == PaymentStatus.UNPAID || a.getPaymentStatus() == PaymentStatus.PARTIAL_PAID
                    || a.getPaymentStatus() == PaymentStatus.PAY_LATER) {
                unpaidCount++;
                if (a.getPaymentDueDate() != null && a.getPaymentDueDate().isBefore(LocalDate.now())) {
                    overdueCount++;
                }
            }
        }

        return PaymentSummaryResponse.builder()
                .clientId(client.getId())
                .clientFullName(client.getFirstName() + " " + client.getLastName())
                .totalAppointments(billableCount)
                .totalFeeCharged(totalFee)
                .totalPaid(totalPaid)
                .totalRemaining(totalRemaining)
                .unpaidCount(unpaidCount)
                .overdueCount(overdueCount)
                .appointments(lines)
                .build();
    }

    /**
     * V2.2A.3: CANCELLED ve NO_SHOW artık tamamen non-billable — ciro/borç
     * hesaplarının hiçbirine dahil edilmez.
     */
    private boolean isBillableAppointment(Appointment a) {
        return a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.NO_SHOW;
    }

    private Client findClient(User psychologist, Long id) {
        return clientRepository.findByIdAndPsychologist(id, psychologist)
                .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));
    }

    private ClientResponse toResponse(Client c) {
        return ClientResponse.builder()
                .id(c.getId())
                .firstName(c.getFirstName())
                .lastName(c.getLastName())
                .phone(c.getPhone())
                .email(c.getEmail())
                .sessionTypePreference(c.getSessionTypePreference() != null ? c.getSessionTypePreference().name() : null)
                .availabilityNotes(c.getAvailabilityNotes())
                .defaultSessionFee(c.getDefaultSessionFee())
                .defaultPaymentMethod(c.getDefaultPaymentMethod() != null ? c.getDefaultPaymentMethod().name() : null)
                .notes(c.getNotes())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
