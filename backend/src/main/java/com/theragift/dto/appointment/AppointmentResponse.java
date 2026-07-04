package com.theragift.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private Long id;
    private Long clientId;
    private String clientFullName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String sessionType;
    private String status;
    private String notes;
    private BigDecimal sessionFee;
    private String paymentStatus;
    private String paymentMethod;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate paymentDate;
    private LocalDate paymentDueDate;
    private String paymentNote;
}
