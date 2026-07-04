package com.theragift.dto.recurring;

import com.theragift.dto.appointment.AppointmentResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * "Önümüzdeki 4 hafta randevuları oluştur" aksiyonunun sonucu.
 * Çakışan occurrence'lar hiç oluşturulmaz ve `skipped` listesinde açık bir
 * sebeple raporlanır — sistemin geri kalanını bozmaz, sadece o tekil slotu atlar.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateOccurrencesResponse {
    private int createdCount;
    private int skippedCount;
    private List<AppointmentResponse> created;
    private List<SkippedOccurrence> skipped;
    private List<String> warnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkippedOccurrence {
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String reason;
    }
}
