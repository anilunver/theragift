package com.theragift.controller;

import com.theragift.dto.appointment.AppointmentRequest;
import com.theragift.dto.appointment.AppointmentResponse;
import com.theragift.dto.appointment.PaymentUpdateRequest;
import com.theragift.service.AppointmentService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<AppointmentResponse> getAll() {
        return appointmentService.getAll(currentUserProvider.getCurrentUser());
    }

    @PostMapping
    public AppointmentResponse create(@RequestBody AppointmentRequest request) {
        return appointmentService.create(currentUserProvider.getCurrentUser(), request);
    }

    @GetMapping("/{id}")
    public AppointmentResponse getById(@PathVariable Long id) {
        return appointmentService.getById(currentUserProvider.getCurrentUser(), id);
    }

    @PutMapping("/{id}")
    public AppointmentResponse update(@PathVariable Long id, @RequestBody AppointmentRequest request) {
        return appointmentService.update(currentUserProvider.getCurrentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        appointmentService.delete(currentUserProvider.getCurrentUser(), id);
    }

    @GetMapping("/week")
    public List<AppointmentResponse> getWeek(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return appointmentService.getWeek(currentUserProvider.getCurrentUser(), weekStart);
    }

    @PutMapping("/{id}/payment")
    public AppointmentResponse updatePayment(@PathVariable Long id, @RequestBody PaymentUpdateRequest request) {
        return appointmentService.updatePayment(currentUserProvider.getCurrentUser(), id, request);
    }
}
