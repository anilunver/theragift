package com.theragift.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSummaryResponse {
    private Long clientId;
    private String clientFullName;
    private int totalAppointments;
    private BigDecimal totalFeeCharged;
    private BigDecimal totalPaid;
    private BigDecimal totalRemaining;
    private int unpaidCount;
    private int overdueCount;
    private List<AppointmentPaymentLine> appointments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentPaymentLine {
        private Long appointmentId;
        private String appointmentDate;
        private BigDecimal sessionFee;
        private String paymentStatus;
        private BigDecimal paidAmount;
        private BigDecimal remainingAmount;
    }
}
