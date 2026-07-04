package com.theragift.dto.recurring;

import com.theragift.enums.PaymentStatus;
import com.theragift.enums.RecurrenceType;
import com.theragift.enums.SessionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class RecurringAppointmentRequest {
    private Long clientId;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private SessionType sessionType;
    private BigDecimal feeAmount;
    private PaymentStatus paymentStatusDefault;
    private RecurrenceType recurrenceType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
    private String note;
}
