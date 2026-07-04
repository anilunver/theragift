package com.theragift.repository;

import com.theragift.entity.AuditLog;
import com.theragift.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // V2.3: Activity Log / İşlem Geçmişi — mevcut AuditLog tablosu (Faz 1'den
    // beri var olan `audit_logs`) yeniden kullanılıyor. Yeni bir "ActivityLog"
    // entity'si oluşturmak, aynı amaca hizmet eden ikinci bir tablo yaratıp
    // AppointmentService'in zaten yazdığı kayıtlarla (APPOINTMENT_CREATED,
    // PAYMENT_UPDATED vb.) tutarsızlığa yol açardı. Bunun yerine bu tablo
    // psikolog bazlı sorgulanabilir hale getirildi.
    List<AuditLog> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<AuditLog> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(User user, LocalDateTime start, LocalDateTime end);
}
