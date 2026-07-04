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
 * V2.2C: Danışan "hafızası" / not defteri. Psikoloğun danışanla ilgili
 * ödeme alışkanlığı, seans sonrası hatırlatma, uygunluk bilgisi vb. tuttuğu
 * MANUEL notlar. Bilinçli olarak basit tutulmuştur — klinik/terapi notu,
 * teşhis, risk/kriz yorumu veya AI analizi İÇERMEZ ve içermemelidir.
 * <p>
 * Mahremiyet: her metodun ilk adımı findClient() — bu, notun sadece İLGİLİ
 * PSİKOLOĞA ait bir danışana bağlı olduğunu garanti eder (findByIdAndPsychologist).
 * Bir psikolog başka bir psikoloğun danışanının notlarına asla erişemez.
 */
@Service
@RequiredArgsConstructor
public class ClientNoteService {

    private final ClientNoteRepository clientNoteRepository;
    private final ClientRepository clientRepository;
    private final ActivityLogService activityLogService;

    public List<ClientNoteResponse> list(User psychologist, Long clientId) {
        Client client = findClient(psychologist, clientId);
        return clientNoteRepository.findByClientOrderByPinnedDescCreatedAtDesc(client)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ClientNoteResponse create(User psychologist, Long clientId, ClientNoteRequest request) {
        Client client = findClient(psychologist, clientId);
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new ApiException("Not içeriği boş olamaz.", HttpStatus.BAD_REQUEST);
        }
        ClientNote note = ClientNote.builder()
                .client(client)
                .psychologist(psychologist)
                .title(blankToNull(request.getTitle()))
                .content(request.getContent())
                .category(request.getCategory())
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .appointmentId(request.getAppointmentId())
                .sessionDate(request.getSessionDate())
                .build();
        clientNoteRepository.save(note);
        // V2.3: Activity Log — KVKK/hassasiyet gereği notun İÇERİĞİ asla loglanmaz,
        // sadece hangi danışan için bir not eklendiği (operasyonel bilgi) yazılır.
        activityLogService.log(psychologist, "CLIENT_NOTE_CREATED", "CLIENT_NOTE", note.getId(),
                client.getFirstName() + " " + client.getLastName() + " için not eklendi.");
        return toResponse(note);
    }

    @Transactional
    public ClientNoteResponse update(User psychologist, Long clientId, Long noteId, ClientNoteRequest request) {
        Client client = findClient(psychologist, clientId);
        ClientNote note = findNote(client, noteId);
        if (request.getContent() != null) {
            if (request.getContent().isBlank()) {
                throw new ApiException("Not içeriği boş olamaz.", HttpStatus.BAD_REQUEST);
            }
            note.setContent(request.getContent());
        }
        if (request.getTitle() != null) note.setTitle(blankToNull(request.getTitle()));
        if (request.getCategory() != null) note.setCategory(request.getCategory());
        if (request.getPinned() != null