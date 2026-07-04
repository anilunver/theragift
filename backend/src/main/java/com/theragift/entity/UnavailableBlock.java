package com.theragift.entity;

import com.theragift.enums.UnavailableBlockType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Psikoloğun normal haftalık çalışma saatlerine ek olarak tanımladığı
 * "çalışma dışı" / "tatil" / "özel iş" gibi istisna dönemleri (V2.2B).
 * Bu entity bir randevu DEĞİLDİR ve mevcut randevuları hiçbir şekilde otomatik
 * iptal etmez — sadece randevu oluşturma, öneriler ve sabit randevu üretimi
 * sırasında merkezi validasyon tarafından "yumuşak uyarı" kaynağı olarak
 * kullanılır (bkz. AppointmentService.computeWarnings).
 */
@Entity
@Table(name = "unavailable_blocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnavailableBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "psychologist_id", nullable = false)
    private User psychologist;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UnavailableBlockType type;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Column(nullable = false)
    private boolean fullDay = true;

    // fullDay=false ise doldurulur; fullDay=true ise ikisi de null kalır ve
    // tüm gün (00:00-23:59 mantığında) kapalı kabul edilir.
    private LocalTime startTime;

    private LocalTime endTime;

    @Column(length = 1000)
    private String note;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
