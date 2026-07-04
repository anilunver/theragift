package com.theragift.controller;

import com.theragift.dto.client.ClientNoteRequest;
import com.theragift.dto.client.ClientNoteResponse;
import com.theragift.service.ClientNoteService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients/{clientId}/notes")
@RequiredArgsConstructor
public class ClientNoteController {

    private final ClientNoteService clientNoteService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<ClientNoteResponse> list(@PathVariable Long clientId) {
        return clientNoteService.list(currentUserProvider.getCurrentUser(), clientId);
    }

    @PostMapping
    public ClientNoteResponse create(@PathVariable Long clientId, @RequestBody ClientNoteRequest request) {
        return clientNoteService.create(currentUserProvider.getCurrentUser(), clientId, request);
    }

    @PutMapping("/{noteId}")
    public ClientNoteResponse update(@PathVariable Long clientId, @PathVariable Long noteId, @RequestBody ClientNoteRequest request) {
        return clientNoteService.update(currentUserProvider.getCurrentUser(), clientId, noteId, request);
    }

    @DeleteMapping("/{noteId}")
    public void delete(@PathVariable Long clientId, @PathVariable Long noteId) {
        clientNoteService.delete(currentUserProvider.getCurrentUser(), clientId, noteId);
    }
}
