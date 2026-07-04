package com.theragift.service;

import com.theragift.dto.activity.ActivityLogResponse;
import com.theragift.entity.AuditLog;
import com.theragift.entity.User;
import com.theragift.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * V2.3: Activity Log / İşlem Geçmişi.
 *
 * Mevcut `AuditLog` entity'si (Faz 1'den beri var olan `audit_logs` tablosu)
 * yeniden kullanılır — yeni bir entity/tablo AÇILMADI. Bu bilinçli bir karar:
 * AppointmentService zaten randevu oluşturma/güncelleme/ödeme güncelleme
 * olaylarını bu tabloya yazıyordu (`action`, `entityType`, `entityId`,
 * `details`, `createdAt` alanlarıyla) — spec'teki ActivityLog alanlarının
 * (actionType, entityType, entityId, title, description, createdAt) hemen
 * hepsi zaten mevcuttu. "title" alanı ayrı bir sütun DEĞİL, actionType'tan
 * burada (titleFor) türetiliyor — hem şema değişikliği riski hem de
 * AppointmentService'in yazdığı eski kayıtlarla tutarsızlık engellenmiş oluyor.
 *
 * KVKK / hassasiyet kuralı: description alanına HİÇBİR ZAMAN klinik içerik,
 * not defteri içeriği veya teşhis/tedavi bilgisi yazılmaz — sadece kısa,
 * operasyonel bir özet (örn. danışan adı, tarih, tutar).
 */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final AuditLogRepository auditLogRepository;

    // Bilinen actionType değerleri için kısa, operasyonel Türkçe başlıklar.
    // Bilinmeyen/gelecekte eklenecek bir actionType için actionType'ın kendisi
    // gösterilir (asla kırılmaz).
    private static final Map<String, String> ACTION_TITLES = Map.ofEntries(
            Map.entry("APPOINTMENT_CREATED", "Yeni randevu oluşturuldu"),
            Map.entry("APPOINTMENT_UPDATED", "Randevu güncellendi"),
            Map.entry("APPOINTMENT_CANCELLED", "Randevu iptal edildi"),
            Map.entry("PAYMENT_UPDATED", "Ödeme güncellendi"),
            Map.entry("CLIENT_CREATED", "Danışan oluşturuldu"),
            Map.entry("CLIENT_UPDATED", "Danışan güncellendi"),
            Map.entry("CLIENT_DEACTIVATED", "Danışan pasif yapıldı"),
            Map.entry("CLIENT_NOTE_CREATED", "Not eklendi"),
            Map.entry("CLIENT_NOTE_UPDATED", "Not güncellendi"),
            Map.entry("UNAVAILABLE_BLOCK_CREATED", "Çalışma dışı blok eklendi"),
            Map.entry("RECURRING_APPOINTMENT_CREATED", "Sabit randevu kuralı oluşturuldu"),
            Map.entry("FEE_UPDATE_APPLIED", "Toplu ücret güncellemesi uygulandı")
    );

    @Transactional
    public void log(User psychologist, String actionType, String entityType, Long entityId, String description) {
        auditLogRepository.save(AuditLog.builder()
                .user(psychologist)
                .action(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .details(description)
                .build());
    }

    public List<ActivityLogResponse> getRecent(User psychologist, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return auditLogRepository.findByUserOrderByCreatedAtDesc(psychologist, PageRequest.of(0, safeLimit))
                .stream().map(this::toResponse).toList();
    }

    public List<ActivityLogResponse> getByRange(User psychologist, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);
        return auditLogRepository.findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(psychologist, start, end)
                .stream().map(this::toResponse).toList();
    }

    private ActivityLogResponse toResponse(AuditLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .actionType(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .title(ACTION_TITLES.getOrDefault(log.getAction(), log.getAction()))
                .description(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
