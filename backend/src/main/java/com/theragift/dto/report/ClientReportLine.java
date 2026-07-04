package com.theragift.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientReportLine {
    private Long clientId;
    private String clientFullName;
    private int totalSessions;
    private int completedCount;
    private int cancelledCount;
    private int noShowCount;
    private BigDecimal collectedAmount;
    private BigDecimal remainingAmount;
    // Seçili tarih aralığından BAĞIMSIZ, danışanın tüm geçmişine bakılarak
    // hesaplanır — "son randevu" ve "sonraki randevu" doğal olarak rapor
    // penceresiyle sınırlı olmamalı.
    private LocalDate lastAppointmentDate;
    private LocalDate nextAppointmentDate;
    private boolean active;
}
