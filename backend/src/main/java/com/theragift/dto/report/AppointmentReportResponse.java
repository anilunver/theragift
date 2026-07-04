package com.theragift.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentReportResponse {
    private int totalScheduled;
    private int completedCount;
    private int cancelledCount;
    private int noShowCount;
    private int onlineCount;
    private int faceToFaceCount;
    // Örn: "Salı". Seçili aralıkta hiç randevu yoksa null.
    private String busiestDayOfWeek;
    // Örn: "10:00-11:00". Seçili aralıkta hiç randevu yoksa null.
    private String busiestHourRange;
}
