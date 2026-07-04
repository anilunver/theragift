package com.theragift.controller;

import com.theragift.dto.client.ClientRequest;
import com.theragift.dto.client.ClientResponse;
import com.theragift.dto.client.ClientStatusChangeResponse;
import com.theragift.dto.client.ClientStatusRequest;
import com.theragift.dto.client.FutureAppointmentsCountResponse;
import com.theragift.dto.client.PaymentSummaryResponse;
import com.theragift.exception.ApiException;
import com.theragift.service.ClientService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<ClientResponse> getAll() {
        return clientService.getAll(currentUserProvider.getCurrentUser());
    }

    @PostMapping
    public ClientResponse create(@RequestBody ClientRequest request) {
        return clientService.create(currentUserProvider.getCurrentUser(), request);
    }

    @GetMapping("/{id}")
    public ClientResponse getById(@PathVariable Long id) {
        return clientService.getById(currentUserProvider.getCurrentUser(), id);
    }

    @PutMapping("/{id}")
    public ClientResponse update(@PathVariable Long id, @RequestBody ClientRequest request) {
        return clientService.update(currentUserProvider.getCurrentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        clientService.delete(currentUserProvider.getCurrentUser(), id);
    }

    @GetMapping("/{id}/payment-summary")
    public PaymentSummaryResponse getPaymentSummary(@PathVariable Long id) {
        return clientService.getPaymentSummary(currentUserProvider.getCurrentUser(), id);
    }

    // V2.2D.1: Danışanı pasif yapmadan önce, frontend'in onay sorusu göstermesi
    // gerekip gerekmediğini anlaması için gelecekteki SCHEDULED randevu sayısı.
    // Hiçbir şeyi DEĞİŞTİRMEZ, sadece okur.
    @GetMapping("/{id}/future-appointments-count")
    public FutureAppointmentsCountResponse getFutureAppointmentsCount(@PathVariable Long id) {
        return clientService.getFutureScheduledAppointmentsCount(currentUserProvider.getCurrentUser(), id);
    }

    // V2.2D: Danışanı aktif/pasif yapmak için niyeti net, ayrı bir endpoint.
    // Bu bir SİLME işlemi değildir — geçmiş randevu/ödeme/not kayıtları etkilenmez.
    // V2.2D.1: cancelFutureAppointments=true ile pasif yapılırsa, SADECE
    // bugünden sonraki SCHEDULED randevular CANCELLED yapılır (bkz. ClientService).
    @PatchMapping("/{id}/status")
    public ClientStatusChangeResponse updateStatus(@PathVariable Long id, @RequestBody ClientStatusRequest request) {
        if (request.getActive() == null) {
            throw new ApiException("active alanı zorunludur.", HttpStatus.BAD_REQUEST);
        }
        boolean cancelFuture = Boolean.TRUE.equals(request.getCancelFutureAppointments());
        return clientService.updateStatus(currentUserProvider.getCurrentUser(), id, request.getActive(), cancelFuture);
    }
}
