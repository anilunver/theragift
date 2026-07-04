package com.theragift.dto.subscription;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private String planName;
    private String description;
    private boolean giftLicense;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private int aiQuotaUsed;
    private int aiQuotaLimit;
}
