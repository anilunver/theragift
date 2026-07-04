package com.theragift.dto.unavailable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnavailableBlockResponse {
    private Long id;
    private String title;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean fullDay;
    private LocalTime startTime;
    private LocalTime endTime;
    private String note;
    // V2.2B madde 13: blok oluşturulurken bu aralığa denk gelen aktif (CANCELLED
    // olmayan) randevu sayısı — sadece bilgilendirme amaçlı, otomatik iptal YOK.
    private Integer affectedAppointmentsCount;
    // V2.2C: aynı randevuların kısa listesi — takvim detay modalı ve blok
    // oluşturma sonrası conflict modalı bu listeyi doğrudan kullanır.
    private List<AffectedAppointmentSummary> affectedAppointments;
    private LocalDateTime createdAt;
}
