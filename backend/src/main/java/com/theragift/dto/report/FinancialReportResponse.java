package com.theragift.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialReportResponse {
    private BigDecimal totalRevenue;
    private BigDecimal collectedAmount;
    private BigDecimal outstandingAmount;
    private BigDecimal overdueAmount;
    private BigDecimal partialPaidAmount;
    private int sessionCount;
    private int cancelledCount;
    private int noShowCount;
    private int freeCount;
    private int packageCount;
}
