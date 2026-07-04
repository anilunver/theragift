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

    // V2.2C: Ek sahiplik/mahremiyet garantisi.