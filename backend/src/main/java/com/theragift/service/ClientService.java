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
        clientRepository.s