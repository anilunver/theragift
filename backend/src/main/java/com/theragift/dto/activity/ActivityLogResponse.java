package com.theragift.dto.activity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    private Long id;
    private String actionType;
    private String entityType;
    private Long entityId;
    // V2.3: Kullanıcıya gösterilecek kısa, operasyonel başlık — actionType'tan
    // backend'de türetilir (bkz. ActivityLogService.titleFor). Örn:
    // "APPOINTMENT_CREATED" -> "Yeni randevu oluşturuldu".
    private String title;
    // KVKK/hassasiyet: description SADECE kısa operasyonel bilgi içerir
    // (örn. danışan adı, tarih). Not içeriği, klinik detay ASLA buraya yazılmaz.
    private String description;
    private LocalDateTime createdAt;
}
