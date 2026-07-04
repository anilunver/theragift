package com.theragift.controller;

import com.theragift.dto.form.PublicFormSubmitRequest;
import com.theragift.dto.form.PublicFormViewResponse;
import com.theragift.service.AvailabilityFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/forms")
@RequiredArgsConstructor
public class PublicFormController {

    private final AvailabilityFormService formService;

    @GetMapping("/{token}")
    public PublicFormViewResponse getForm(@PathVariable String token) {
        return formService.getPublicForm(token);
    }

    @PostMapping("/{token}/submit")
    public void submit(@PathVariable String token, @RequestBody PublicFormSubmitRequest request) {
        formService.submitPublicForm(token, request);
    }
}
