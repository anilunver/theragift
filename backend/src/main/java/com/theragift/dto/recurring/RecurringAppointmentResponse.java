package com.theragift.dto.recurring;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringAppointmentResponse {
    private Long id;
    private Long clientId;
    private String clientFullName;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String sessionType;
    private BigDecimal feeAmount;
    private String paymentStatusDefault;
    private String recurrenceType;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private String note;
    private LocalDateTime createdAt;
}
