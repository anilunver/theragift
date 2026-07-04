package com.theragift.entity;

import com.theragift.enums.AvailabilityFormStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "availability_forms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "psychologist_id", nullable = false)
    private User psychologist;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AvailabilityFormStatus status = AvailabilityFormStatus.PENDING;

    // Danışanın form üzerinden girdiği bilgiler
    @Column(length = 2000)
    private String preferredDays; // "Pazartesi, Çarşamba" gibi serbest metin/CSV

    @Column(length = 500)
    private String preferredTimeRange; // "10:00-14:00" gibi

    @Column(length = 2000)
    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime submittedAt;

    private LocalDateTime expiresAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = createdAt.plusDays(14);
    }
}
