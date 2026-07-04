package com.theragift.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usage_quotas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "psychologist_id", nullable = false, unique = true)
    private User psychologist;

    @Builder.Default
    private Integer aiQuotaUsed = 0;

    @Builder.Default
    private Integer aiQuotaLimit = 50;

    private LocalDateTime lastResetAt;

    @PrePersist
    void prePersist() {
        lastResetAt = LocalDateTime.now();
    }
}
