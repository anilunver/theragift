package com.theragift.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlySummaryResponse {
    private int year;
    private int month;
    private BigDecimal totalRevenue;
    private BigDecimal totalPaid;
    private BigDecimal totalUnpaid;
    private int totalAppointments;
    private int paidCount;
    private int unpaidCount;
}
