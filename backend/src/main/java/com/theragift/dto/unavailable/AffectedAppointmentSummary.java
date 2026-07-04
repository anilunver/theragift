package com.theragift.dto.unavailable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * V2.2C: Bir unavailable block'un tarih/saat aralığına denk gelen aktif
 * (CANCELLED olmayan) randevunun kısa özeti. Sadece bilgilendirme amaçlıdır —
 * bu özet randevu üzerinde hiçbir değişiklik yapmaz.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectedAppointmentSummary {
    private Long appointmentId;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String clientFullName;
    private String status;
    private String sessionType;
}
