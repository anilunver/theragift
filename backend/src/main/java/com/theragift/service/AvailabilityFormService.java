package com.theragift.service;

import com.theragift.dto.form.*;
import com.theragift.entity.AvailabilityForm;
import com.theragift.entity.Client;
import com.theragift.entity.User;
import com.theragift.enums.AvailabilityFormStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.AvailabilityFormRepository;
import com.theragift.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvailabilityFormService {

    private final AvailabilityFormRepository formRepository;
    private final ClientRepository clientRepository;

    @Transactional
    public FormLinkResponse createLink(User psychologist, CreateFormLinkRequest request) {
        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findByIdAndPsychologist(request.getClientId(), psychologist)
                    .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        AvailabilityForm form = AvailabilityForm.builder()
                .psychologist(psychologist)
                .client(client)
                .token(token)
                .status(AvailabilityFormStatus.PENDING)
                .build();
        formRepository.save(form);

        return FormLinkResponse.builder()
                .id(form.getId())
                .token(token)
                .publicUrl("/public/forms/" + token)
                .status(form.getStatus().name())
                .build();
    }

    public List<PendingFormResponse> getPending(User psychologist) {
        return formRepository.findByPsychologistAndStatusOrderByCreatedAtDesc(psychologist, AvailabilityFormStatus.PENDING)
                .stream().map(this::toPendingResponse).toList();
    }

    public List<PendingFormResponse> getAllForms(User psychologist) {
        return formRepository.findByPsychologistOrderByCreatedAtDesc(psychologist)
                .stream().map(this::toPendingResponse).toList();
    }

    public PublicFormViewResponse getPublicForm(String token) {
        AvailabilityForm form = formRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Form bulunamadı veya süresi dolmuş", HttpStatus.NOT_FOUND));

        return PublicFormViewResponse.builder()
                .token(token)
                .status(form.getStatus().name())
                .psychologistName(form.getPsychologist().getFullName())
                .alreadySubmitted(form.getStatus() == AvailabilityFormStatus.SUBMITTED)
                .build();
    }

    @Transactional
    public void submitPublicForm(String token, PublicFormSubmitRequest request) {
        AvailabilityForm form = formRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Form bulunamadı veya süresi dolmuş", HttpStatus.NOT_FOUND));

        if (form.getStatus() == AvailabilityFormStatus.SUBMITTED) {
            throw new ApiException("Bu form zaten gönderilmiş", HttpStatus.CONFLICT);
        }

        // Danışan formda kendini tanıttıysa ve sistemde yoksa yeni danışan kaydı oluştur
        if (form.getClient() == null && request.getFirstName() != null) {
            Client client = Client.builder()
                    .psychologist(form.getPsychologist())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName() != null ? request.getLastName() : "")
                    .phone(request.getPhone())
                    .email(request.getEmail())
                    .availabilityNotes(request.getPreferredDays())
                    .active(true)
                    .build();
            clientRepository.save(client);
            form.setClient(client);
        }

        form.setPreferredDays(request.getPreferredDays());
        form.setPreferredTimeRange(request.getPreferredTimeRange());
        form.setNotes(request.getNotes());
        form.setStatus(AvailabilityFormStatus.SUBMITTED);
        form.setSubmittedAt(LocalDateTime.now());

        formRepository.save(form);
    }

    private PendingFormResponse toPendingResponse(AvailabilityForm form) {
        return PendingFormResponse.builder()
                .id(form.getId())
                .token(form.getToken())
                .status(form.getStatus().name())
                .clientFullName(form.getClient() != null ? form.getClient().getFirstName() + " " + form.getClient().getLastName() : null)
                .preferredDays(form.getPreferredDays())
                .preferredTimeRange(form.getPreferredTimeRange())
                .notes(form.getNotes())
                .createdAt(form.getCreatedAt())
                .submittedAt(form.getSubmittedAt())
                .build();
    }
}
