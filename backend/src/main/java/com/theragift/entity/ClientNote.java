package com.theragift.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Danışan hakkında psikoloğun tuttuğu OPERASYONEL not (örn. "Ödemeyi ay sonunda
 * yapıyor.", "Online seansı tercih ediyor."). Klinik/terapi içeriği DEĞİLDİR —
 * bilinçli olarak ayrı ve basit tutulmuştur.
 */
@Entity
@Table(name = "client_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false, length = 2000)
    private String note;

    @Builder.Default
    private boolean pinned = false;

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
