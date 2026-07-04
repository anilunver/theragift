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
 *
 * Akış (V2.2A.1'de netleştirildi):
 * - `blockers`: sert engeller (aynı saatte aktif randevu var). Bunlar
 *   `overrideWarnings=true` gelse bile ASLA oluşturulmaz.
 * - `warnings`: yumuşak uyarılar (mesai dışı / mola / danışan uygunluğu dışı).
 *   Eğer hiç warning yoksa randevular DİREKT oluşturulur (requiresConfirmation=false).
 *   Warning varsa VE `overrideWarnings=false` ise HİÇBİR randevu oluşturulmaz,
 *   `requiresConfirmation=true` döner ve `createdAppointments` boş olur — frontend
 *   bu durumda kullanıcıya onay modalı göstermeli. Kullanıcı onaylarsa aynı istek
 *   `overrideWarnings=true` ile tekrar gönderilir ve bu sefer warning'li (ama
 *   blocker'sız) occurrence'lar da oluşturulur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateOccurrencesResponse {
    private boolean requiresConfirmation;
    private int createdCount;
    private List<AppointmentResponse> createdAppointments;
    private List<OccurrenceIssue> blockers;
    private List<OccurrenceIssue> warnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OccurrenceIssue {
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String message;
    }
}
