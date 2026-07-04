package com.theragift.config;

import com.theragift.entity.*;
import com.theragift.enums.*;
import com.theragift.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Uygulama ilk açıldığında demo verisi oluşturur.
 * Böylece kullanıcı hiçbir şey yapmadan sistemi görebilir.
 */
@Component
@RequiredArgsConstructor
public class SeedDataRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PsychologistProfileRepository profileRepository;
    private final WorkingHourRepository workingHourRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UsageQuotaRepository usageQuotaRepository;
    private final AvailabilityFormRepository formRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEMO_EMAIL = "demo@theragift.app";

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail(DEMO_EMAIL)) {
            return; // seed zaten yapılmış
        }

        User demoUser = userRepository.save(User.builder()
                .email(DEMO_EMAIL)
                .password(passwordEncoder.encode("password123"))
                .fullName("Uzm. Psk. Ayşe Demirtaş")
                .role(Role.PSYCHOLOGIST)
                .active(true)
                .build());

        PsychologistProfile profile = profileRepository.save(PsychologistProfile.builder()
                .user(demoUser)
                .title("Uzm. Psk.")
                .specialty("Yetişkin Terapisi")
                .phone("0555 000 00 00")
                .bio("10 yıllık klinik deneyime sahip uzman psikolog.")
                .defaultSessionFee(BigDecimal.valueOf(1500))
                .defaultPaymentMethod(PaymentMethod.BANK_TRANSFER)
                .defaultSessionDurationMinutes(50)
                .build());

        // Çalışma saatleri: Pazartesi-Cuma 09:00-17:00, öğlen molası 12:00-13:00
        for (DayOfWeek day : new DayOfWeek[]{DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY}) {
            workingHourRepository.save(WorkingHour.builder()
                    .psychologist(demoUser)
                    .dayOfWeek(day)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(17, 0))
                    .breakStartTime(LocalTime.of(12, 0))
                    .breakEndTime(LocalTime.of(13, 0))
                    .active(true)
                    .build());
        }
        // Cumartesi kısa gün
        workingHourRepository.save(WorkingHour.builder()
                .psychologist(demoUser)
                .dayOfWeek(DayOfWeek.SATURDAY)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(14, 0))
                .active(true)
                .build());

        // 5 danışan
        Client client1 = clientRepository.save(Client.builder()
                .psychologist(demoUser)
                .firstName("Elif").lastName("Yıldız")
                .phone("0532 111 22 33").email("elif.yildiz@example.com")
                .sessionTypePreference(SessionType.ONLINE)
                .availabilityNotes("Pazartesi ve Çarşamba günleri öğleden sonra uygun")
                .defaultSessionFee(BigDecimal.valueOf(1500))
                .defaultPaymentMethod(PaymentMethod.BANK_TRANSFER)
                .notes("Kaygı bozukluğu ile ilgili destek alıyor.")
                .active(true)
                .build());

        Client client2 = clientRepository.save(Client.builder()
                .psychologist(demoUser)
                .firstName("Mehmet").lastName("Kaya")
                .phone("0533 222 33 44").email("mehmet.kaya@example.com")
                .sessionTypePreference(SessionType.FACE_TO_FACE)
                .availabilityNotes("Salı ve Perşembe sabah saatleri")
                .defaultSessionFee(BigDecimal.valueOf(1800))
                .defaultPaymentMethod(PaymentMethod.CASH)
                .notes("Çift terapisi sonrası bireysel seanslara devam ediyor.")
                .active(true)
                .build());

        Client client3 = clientRepository.save(Client.builder()
                .psychologist(demoUser)
                .firstName("Zeynep").lastName("Arslan")
                .phone("0534 333 44 55").email("zeynep.arslan@example.com")
                .sessionTypePreference(SessionType.ONLINE)
                .availabilityNotes("Cuma günleri her saat uygun")
                .defaultSessionFee(BigDecimal.valueOf(1500))
                .defaultPaymentMethod(PaymentMethod.CREDIT_CARD_MANUAL)
                .notes("Paket seans kullanıyor: 8 seanslık paket.")
                .active(true)
                .build());

        Client client4 = clientRepository.save(Client.builder()
                .psychologist(demoUser)
                .firstName("Can").lastName("Özdemir")
                .phone("0535 444 55 66").email("can.ozdemir@example.com")
                .sessionTypePreference(SessionType.FACE_TO_FACE)
                .availabilityNotes("Pazartesi sabah")
                .defaultSessionFee(BigDecimal.valueOf(1600))
                .defaultPaymentMethod(PaymentMethod.BANK_TRANSFER)
                .notes("Ödemelerini genelde geciktiriyor, takip gerekiyor.")
                .active(true)
                .build());

        Client client5 = clientRepository.save(Client.builder()
                .psychologist(demoUser)
                .firstName("Selin").lastName("Aydın")
                .phone("0536 555 66 77").email("selin.aydin@example.com")
                .sessionTypePreference(SessionType.ONLINE)
                .availabilityNotes("Çarşamba ve Cuma akşam saatleri")
                .defaultSessionFee(BigDecimal.valueOf(1500))
                .defaultPaymentMethod(PaymentMethod.ONLINE_LINK)
                .notes("Yeni danışan, ilk görüşme yapıldı.")
                .active(true)
                .build());

        LocalDate today = LocalDate.now();

        // Geçmiş randevu - ödendi
        appointmentRepository.save(Appointment.builder()
                .client(client1).psychologist(demoUser)
                .appointmentDate(today.minusDays(7))
                .startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(10, 50))
                .sessionType(SessionType.ONLINE)
                .status(AppointmentStatus.COMPLETED)
                .sessionFee(BigDecimal.valueOf(1500))
                .paymentStatus(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paidAmount(BigDecimal.valueOf(1500))
                .remainingAmount(BigDecimal.ZERO)
                .paymentDate(today.minusDays(7))
                .build());

        // Bugünkü randevu - ödenmedi
        appointmentRepository.save(Appointment.builder()
                .client(client2).psychologist(demoUser)
                .appointmentDate(today)
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(9, 50))
                .sessionType(SessionType.FACE_TO_FACE)
                .status(AppointmentStatus.SCHEDULED)
                .sessionFee(BigDecimal.valueOf(1800))
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod(PaymentMethod.CASH)
                .remainingAmount(BigDecimal.valueOf(1800))
                .paymentDueDate(today.plusDays(3))
                .build());

        // Bugünkü randevu - kısmi ödeme
        appointmentRepository.save(Appointment.builder()
                .client(client3).psychologist(demoUser)
                .appointmentDate(today)
                .startTime(LocalTime.of(14, 0)).endTime(LocalTime.of(14, 50))
                .sessionType(SessionType.ONLINE)
                .status(AppointmentStatus.SCHEDULED)
                .sessionFee(BigDecimal.valueOf(1500))
                .paymentStatus(PaymentStatus.PARTIAL_PAID)
                .paymentMethod(PaymentMethod.CREDIT_CARD_MANUAL)
                .paidAmount(BigDecimal.valueOf(750))
                .remainingAmount(BigDecimal.valueOf(750))
                .paymentDueDate(today.plusDays(5))
                .build());

        // Geciken ödeme - vadesi geçmiş
        appointmentRepository.save(Appointment.builder()
                .client(client4).psychologist(demoUser)
                .appointmentDate(today.minusDays(10))
                .startTime(LocalTime.of(11, 0)).endTime(LocalTime.of(11, 50))
                .sessionType(SessionType.FACE_TO_FACE)
                .status(AppointmentStatus.COMPLETED)
                .sessionFee(BigDecimal.valueOf(1600))
                .paymentStatus(PaymentStatus.PAY_LATER)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .remainingAmount(BigDecimal.valueOf(1600))
                .paymentDueDate(today.minusDays(3))
                .paymentNote("Danışan seyahatte olduğunu belirtti, ödeme sonra yapılacak.")
                .build());

        // Gelecek randevu - paket kullanımı
        appointmentRepository.save(Appointment.builder()
                .client(client3).psychologist(demoUser)
                .appointmentDate(today.plusDays(2))
                .startTime(LocalTime.of(15, 0)).endTime(LocalTime.of(15, 50))
                .sessionType(SessionType.ONLINE)
                .status(AppointmentStatus.SCHEDULED)
                .sessionFee(BigDecimal.valueOf(1500))
                .paymentStatus(PaymentStatus.PACKAGE_USED)
                .paymentMethod(PaymentMethod.PACKAGE)
                .paidAmount(BigDecimal.ZERO)
                .remainingAmount(BigDecimal.ZERO)
                .paymentNote("8 seanslık paketten düşüldü (3/8).")
                .build());

        // Gelecek randevu - henüz ödeme durumu belirsiz
        appointmentRepository.save(Appointment.builder()
                .client(client5).psychologist(demoUser)
                .appointmentDate(today.plusDays(3))
                .startTime(LocalTime.of(16, 0)).endTime(LocalTime.of(16, 50))
                .sessionType(SessionType.ONLINE)
                .status(AppointmentStatus.SCHEDULED)
                .sessionFee(BigDecimal.valueOf(1500))
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod(PaymentMethod.ONLINE_LINK)
                .remainingAmount(BigDecimal.valueOf(1500))
                .paymentDueDate(today.plusDays(6))
                .build());

        // İptal edilmiş randevu örneği
        appointmentRepository.save(Appointment.builder()
                .client(client1).psychologist(demoUser)
                .appointmentDate(today.minusDays(2))
                .startTime(LocalTime.of(13, 0)).endTime(LocalTime.of(13, 50))
                .sessionType(SessionType.ONLINE)
                .status(AppointmentStatus.CANCELLED)
                .sessionFee(BigDecimal.valueOf(1500))
                .paymentStatus(PaymentStatus.CANCELLED)
                .remainingAmount(BigDecimal.ZERO)
                .build());

        // Gift License planı ve aboneliği
        SubscriptionPlan giftPlan = planRepository.save(SubscriptionPlan.builder()
                .name("Gift License")
                .description("TheraGift tarafından hediye edilen ücretsiz lisans")
                .price(BigDecimal.ZERO)
                .durationDays(365)
                .aiQuotaLimit(50)
                .giftLicense(true)
                .build());

        subscriptionRepository.save(Subscription.builder()
                .psychologist(demoUser)
                .plan(giftPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(today.minusDays(30))
                .endDate(today.plusDays(335))
                .build());

        usageQuotaRepository.save(UsageQuota.builder()
                .psychologist(demoUser)
                .aiQuotaUsed(12)
                .aiQuotaLimit(50)
                .lastResetAt(LocalDateTime.now())
                .build());

        // Bekleyen uygunluk formu örneği
        formRepository.save(AvailabilityForm.builder()
                .psychologist(demoUser)
                .client(null)
                .token("demoformtoken1234567890")
                .status(AvailabilityFormStatus.PENDING)
                .build());

        formRepository.save(AvailabilityForm.builder()
                .psychologist(demoUser)
                .client(client2)
                .token("demoformtoken0987654321")
                .status(AvailabilityFormStatus.PENDING)
                .build());
    }
}
