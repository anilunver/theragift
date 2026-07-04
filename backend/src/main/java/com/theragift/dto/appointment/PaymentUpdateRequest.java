package com.theragift.dto.appointment;

import com.theragift.enums.PaymentMethod;
import com.theragift.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentUpdateRequest {
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private BigDecimal paidAmount;
    private LocalDate paymentDate;
    private LocalDate paymentDueDate;
    private String paymentNote;
}
