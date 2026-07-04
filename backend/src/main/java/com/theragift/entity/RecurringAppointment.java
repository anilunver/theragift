package com.theragift.entity;

import com.theragift.enums.PaymentStatus;
import com.theragift.enums.RecurrenceType;
import com.theragift.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Bir danışan için tanımlanan "sabit / tekrarlayan randevu" kuralı.
 * Bu entity kendisi bir randevu DEĞİLDİR — gerçek Appointment kayıtları,
 * RecurringAppointmentService.generateNextOccurrences() çağrıldığında bu kurala
 * göre üretilir. Böylece takvim, ödeme ve öneri modülleri hiçbir değişikliğe
 * gerek kalmadan bu randevuları normal Appointment gibi görür.
 */
@Entity
@Table(name = "recurring_appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne
    @JoinColumn(name = "psychologist_id", nullable = false)
    private User psychologist;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionType sessionType;

    @Column(precision = 10, scale = 2)
    private BigDecimal feeAmount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatusDefault = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecurrenceType recurrenceType;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private boolean active = true;

    @Column(length = 1000)
    private String note;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
