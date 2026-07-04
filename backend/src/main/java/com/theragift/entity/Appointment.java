package com.theragift.entity;

import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentMethod;
import com.theragift.enums.PaymentStatus;
import com.theragift.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne
    @JoinColumn(name = "psychologist_id", nullable = false)
    private User psychologist;

    // V2.2A.2: Bu randevu bir sabit randevu (recurring) kuralından üretildiyse
    // ilişkilendirilir. Nullable — manuel oluşturulan randevularda null kalır.
    // Sadece "kuralı pasifleştirince gelecekteki randevuları da iptal et" gibi
    // opsiyonel toplu işlemler için kullanılır; normal randevu akışını etkilemez.
    @ManyToOne
    @JoinColumn(name = "recurring_appointment_id")
    private RecurringAppointment recurringAppointment;

    @Column(nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionType sessionType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(length = 2000)
    private String notes;

    @Column(precision = 10, scale = 2)
    private BigDecimal sessionFee;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(precision = 10, scale = 2)
    private BigDecimal paidAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal remainingAmou