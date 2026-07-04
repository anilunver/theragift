package com.theragift.controller;

import com.theragift.dto.recurring.CancelFutureResponse;
import com.theragift.dto.recurring.GenerateOccurrencesResponse;
import com.theragift.dto.recurring.RecurringAppointmentRequest;
import com.theragift.dto.recurring.RecurringAppointmentResponse;
import com.theragift.service.RecurringAppointmentService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-appointments")
@RequiredArgsConstructor
public class RecurringAppointmentController {

    private final RecurringAppointmentService recurringAppointmentService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<RecurringAppointmentResponse> list(@RequestParam(required = false) Long clientId) {
        return recurringAppointmentService.list(currentUserProvider.getCurrentUser(), clientId);
    }

    @PostMapping
    public RecurringAppointmentResponse create(@RequestBody RecurringAppointmentRequest request) {
        return recurringAppointmentService.create(currentUserProvider.getCurrentUser(), request);
    }

    @PutMapping("/{id}")
    public RecurringAppointmentResponse update(@PathVariable Long id, @RequestBody RecurringAppointmentRequest request) {
        return recurringAppointmentService.update(currentUserProvider.getCurrentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        recurringAppointmentService.delete(currentUserProvider.getCurrentUser(), id);
    }

    @PostMapping("/{id}/generate")
    public GenerateOccurrencesResponse generate(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean overrideWarnings) {
        return recurringAppointmentService.generateNextOccurrences(currentUserProvider.getCurrentUser(), id, overrideWarnings);
    }

    // V2.2A.2: "Pasif yap" sonrası opsiyonel ikinci adım — sadece bu kurala bağlı,
    // gelecekteki ve hâlâ SCHEDULED olan randevuları CANCELLED yapar.
    @PostMapping("/{id}/cancel-future")
    public CancelFutureResponse cancelFuture(@PathVariable Long id) {
        int cancelledCount = recurringAppointmentService.cancelFutureAppointments(currentUserProvider.getCurrentUser(), id);
        return CancelFutureResponse.builder().cancelledCount(cancelledCount).build();
    }
}
