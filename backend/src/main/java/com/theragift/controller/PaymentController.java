package com.theragift.controller;

import com.theragift.dto.appointment.AppointmentResponse;
import com.theragift.dto.payment.MonthlySummaryResponse;
import com.theragift.service.PaymentService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUserProvider currentUserProvider;

    // Geriye dönük uyumluluk için korunuyor (eski frontend/entegrasyonlar için).
    @GetMapping("/unpaid")
    public List<AppointmentResponse> getUnpaid() {
        return paymentService.getUnpaid(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/to-collect")
    public List<AppointmentResponse> getToCollect() {
        return paymentService.getToCollect(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/overdue")
    public List<AppointmentResponse> getOverdue() {
        return paymentService.getOverdue(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/partial")
    public List<AppointmentResponse> getPartial() {
        return paymentService.getPartial(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/paid")
    public List<AppointmentResponse> getPaid() {
        return paymentService.getPaid(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/package-free")
    public List<AppointmentResponse> getPackageOrFree() {
        return paymentService.getPackageOrFree(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/monthly-summary")
    public MonthlySummaryResponse getMonthlySummary() {
        return paymentService.getMonthlySummary(currentUserProvider.getCurrentUser());
    }
}
