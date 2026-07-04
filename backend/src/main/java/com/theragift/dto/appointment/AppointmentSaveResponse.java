package com.theragift.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Randevu oluşturma cevabı. Sert kurallar (çakışma) her zaman engeller ve hata
 * fırlatır. Yumuşak kurallar (mola/mesai dışı/danışan uygunluğu) engellemez;
 * bunun yerine `requiresConfirmation=true` ile randevu KAYDEDİLMEDEN uyarı listesi
 * döner. Kullanıcı onaylarsa aynı istek `overrideWarnings=true` ile tekrar gönderilir
 * ve bu sefer `appointment` dolu, `requiresConfirmation=false` döner.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentSaveResponse {
    private AppointmentResponse appointment;
    private List<String> warnings;
    private boolean requiresConfirmation;
}
