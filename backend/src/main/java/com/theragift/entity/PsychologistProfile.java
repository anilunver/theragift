package com.theragift.entity;

import com.theragift.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (defaultSessionDurationMinutes == null) defaultSessionDurationMinutes = 50;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
