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
        clientService.delete(currentUserProvider.getCurrentUse