package com.theragift.service;

import com.theragift.dto.client.ClientNoteRequest;
import com.theragift.dto.client.ClientNoteResponse;
import com.theragift.entity.Client;
import com.theragift.entity.ClientNote;
import com.theragift.entity.User;
import com.theragift.exception.ApiException;
import com.theragift.repository.ClientNoteRepository;
import com.theragift.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Danışan operasyonel notları. Bilinçli olarak basit tutulmuştur — klinik/terapi
 * notu DEĞİLDİR, hassas terapi içeriğine girilmez (örn. "Ödemeyi genelde ay
 * sonunda yapıyor.", "Online seansı tercih ediyor.").
 */
@Service
@RequiredArgsConstructor
public class ClientNoteService {

    private final ClientNoteRepository clientNoteRepository;
    private final ClientRepository clientRepository;

    public List<ClientNoteResponse> list(User psychologist, Long clientId) {
        Client client = findClient(psychologist, clientId);
        return clientNoteRepository.findByClientOrderByPinnedDescCreatedAtDesc(client)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ClientNoteResponse create(User psychologist, Long clientId, ClientNoteRequest request) {
        Client client = findClient(psychologist, clientId);
        if (request.getNote() == null || request.getNote().isBlank()) {
            throw new ApiException("Not içeriği boş olamaz.", HttpStatus.BAD_REQUEST);
        }
        ClientNote note = ClientNote.builder()
                .client(client)
                .note(request.getNote())
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .build();
        clientNoteRepository.save(note);
        return toResponse(note);
    }

    @Transactional
    public ClientNoteResponse update(User psychologist, Long clientId, Long noteId, ClientNoteRequest request) {
        Client client = findClient(psychologist, clientId);
        ClientNote note = findNote(client, noteId);
        if (request.getNote() != null) {
            if (request.getNote().isBlank()) {
                throw new ApiException("Not içeriği boş olamaz.", HttpStatus.BAD_REQUEST);
            }
            note.setNote(request.getNote());
        }
        if (request.getPinned() != null) note.setPinned(request.getPinned());
        clientNoteRepository.save(note);
        return toResponse(note);
    }

    @Transactional
    public void delete(User psychologist, Long clientId, Long noteId) {
        Client client = findClient(psychologist, clientId);
        ClientNote note = findNote(client, noteId);
        clientNoteRepository.delete(note);
    }

    private ClientNote findNote(Client client, Long noteId) {
        return clientNoteRepository.findByIdAndClient(noteId, client)
                .orElseThrow(() -> new ApiException("Not bulunamadı", HttpStatus.NOT_FOUND));
    }

    private Client findClient(User psychologist, Long clientId) {
        return clientRepository.findByIdAndPsychologist(clientId, psychologist)
                .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));
    }

    private ClientNoteResponse toResponse(ClientNote n) {
        return ClientNoteResponse.builder()
                .id(n.getId())
                .clientId(n.getClient().getId())
                .note(n.getNote())
                .pinned(n.isPinned())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}
