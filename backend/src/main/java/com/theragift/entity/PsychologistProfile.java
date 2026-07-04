package com.theragift.entity;

import com.theragift.enums.PaymentMethod;
import com.theragift.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * V2.2D NOT: Bu entity, psikoloğun genel "klinik / pratik ayarları"nı
 * (PracticeSettings) da kapsayacak şekilde genişletilmiştir. Ayrı bir
 * PracticeSettings entity'si oluşturulmadı çünkü defaultSessionFee /
 * defaultPaymentMethod / defaultSessionDurationMinutes gibi alanlar zaten
 * burada mevcuttu — aynı amaca hizmet eden ikinci bir tablo yaratmak
 * gereksiz karmaşıklık ve tutarsızlık riski doğururdu. getProfile() zaten
 * her psikolog için otomatik varsayılan kayıt oluşturuyordu, bu davranış
 * korunmuştur.
 */
@Entity
@Table(name = "psychologist_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychologistProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String title; // Uzm. Psk. vb.

    private String specialty; // Uzmanlık alanı

    private String phone;

    @Column(length = 1000)
    private String bio;

    @Column(precision = 10, scale = 2)
    private BigDecimal defaultSessionFee;

    @Enumerated(EnumType.STRING)
    private PaymentMethod defaultPaymentMethod;

    private Integer defaultSessionDurationMinutes;

    // --- V2.2D: Klinik / Pratik Ayarları (PracticeSettings) alanları ---
    private String clinicName;

    @Enumerated(EnumType.STRING)
    private SessionType defaultSessionType;

    private Integer defaultBufferMinutes;

    private String currency;

    @Column(length = 1000)
    private String practiceNotes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        applyDefaults();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
        applyDefaults();
    }

    private void applyDefaults() {
        if (defaultSessionDurationMinutes == null) defaultSessionDurationMinutes = 50;
        if (defaultSessionType == null) defaultSessionType = SessionType.ONLINE;
        if (defaultBufferMinutes == null) defaultBufferMinutes = 0;
        if (currency == null || currency.isBlank()) currency = "TRY";
    }
}
