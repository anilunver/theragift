package com.theragift.entity;

import com.theragift.enums.ClientNoteCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * V2.2C: Danışan "hafızası" / not defteri. Psikoloğun danışanla ilgili
 * ödeme alışkanlığı, seans sonrası hatırlatma, uygunluk bilgisi vb. tuttuğu
 * MANUEL notlar. Bilinçli olarak basit tutulmuştur — klinik/terapi notu,
 * teşhis, risk/kriz yorumu veya AI analizi İÇERMEZ ve içermemelidir.
 * <p>
 * Mahremiyet: bu notlar sadece ilgili danışanın psikoloğu tarafından
 * görülebilir. Sahiplik kontrolü hem Client (client.psychologist) hem de
 * doğrudan bu entity üzerindeki `psychologist` alanı üzerinden sağlanır.
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

    // V2.2C: Ek sahiplik/mahremiyet garantisi. Mevcut kayıtlarda (V2.2A'dan
    // kalan) bu alan null olabilir — Client üzerinden zaten psikoloğa bağlı
    // olduğu için sorun teşkil etmez, yeni notlar için her zaman doldurulur.
    @ManyToOne
    @JoinColumn(name = "psychologist_id")
    private User psychologist;

    @Column(length = 200)
    private String title;

    // ÖNEMLİ: DB kolon adı geriye dönük uyumluluk için "note" olarak korunmuştur
    // (V2.2A'dan beri var olan mevcut veriyi bozmamak için) — Java tarafında
    // API/okunabilirlik açısından daha uygun olan "content" adı kullanılır.
    @Column(name = "note", nullable = false, length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    private ClientNoteCategory category;

    @Builder.Default
    private boolean pinned = false;

    private Long appointmentId;

    private LocalDate sessionDate;

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
