package com.theragift.controller;

import com.theragift.dto.subscription.SubscriptionResponse;
import com.theragift.service.SubscriptionService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/current")
    public SubscriptionResponse getCurrent() {
        return subscriptionService.getCurrent(currentUserProvider.getCurrentUser());
    }
}
