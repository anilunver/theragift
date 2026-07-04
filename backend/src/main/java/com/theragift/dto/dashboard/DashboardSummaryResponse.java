package com.theragift.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private int todayAppointmentsCount;
    private int availableSlotsCount;
    private int pendingFormsCount;
    private BigDecimal todayRevenue;
    private BigDecimal unpaidAmount;
    private int overduePaymentsCount;
    private BigDecimal monthlyRevenue;
    private boolean giftLicenseActive;
    private int aiQuotaUsed;
    private int aiQuotaLimit;
}
