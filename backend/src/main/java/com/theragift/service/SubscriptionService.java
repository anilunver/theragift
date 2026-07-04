package com.theragift.service;

import com.theragift.dto.subscription.SubscriptionResponse;
import com.theragift.entity.Subscription;
import com.theragift.entity.UsageQuota;
import com.theragift.entity.User;
import com.theragift.enums.SubscriptionStatus;
import com.theragift.repository.SubscriptionRepository;
import com.theragift.repository.UsageQuotaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UsageQuotaRepository usageQuotaRepository;

    public SubscriptionResponse getCurrent(User psychologist) {
        Subscription subscription = subscriptionRepository.findByPsychologist(psychologist).orElse(null);
        UsageQuota quota = usageQuotaRepository.findByPsychologist(psychologist).orElse(null);

        if (subscription == null) {
            return SubscriptionResponse.builder()
                    .planName("Yok")
                    .status("EXPIRED")
                    .giftLicense(false)
                    .aiQuotaUsed(0)
                    .aiQuotaLimit(0)
                    .build();
        }

        return SubscriptionResponse.builder()
                .planName(subscription.getPlan().getName())
                .description(subscription.getPlan().getDescription())
                .giftLicense(subscription.getPlan().isGiftLicense())
                .status(subscription.getStatus().name())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .aiQuotaUsed(quota != null ? quota.getAiQuotaUsed() : 0)
                .aiQuotaLimit(quota != null ? quota.getAiQuotaLimit() : 0)
                .build();
    }

    public boolean isGiftLicenseActive(User psychologist) {
        return subscriptionRepository.findByPsychologist(psychologist)
                .map(s -> s.getPlan().isGiftLicense() && s.getStatus() == SubscriptionStatus.ACTIVE)
                .orElse(false);
    }
}
