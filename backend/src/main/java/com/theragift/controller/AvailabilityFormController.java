package com.theragift.controller;

import com.theragift.dto.form.CreateFormLinkRequest;
import com.theragift.dto.form.FormLinkResponse;
import com.theragift.dto.form.PendingFormResponse;
import com.theragift.service.AvailabilityFormService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/availability-forms")
@RequiredArgsConstructor
public class AvailabilityFormController {

    private final AvailabilityFormService formService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/create-link")
    public FormLinkResponse createLink(@RequestBody(required = false) CreateFormLinkRequest request) {
        return formService.createLink(currentUserProvider.getCurrentUser(),
                request != null ? request : new CreateFormLinkRequest());
    }

    @GetMapping("/pending")
    public List<PendingFormResponse> getPending() {
        return formService.getPending(currentUserProvider.getCurrentUser());
    }

    @GetMapping
    public List<PendingFormResponse> getAll() {
        return formService.getAllForms(currentUserProvider.getCurrentUser());
    }
}
