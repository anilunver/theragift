package com.theragift.controller;

import com.theragift.dto.practice.FeeUpdateApplyResponse;
import com.theragift.dto.practice.FeeUpdatePreviewResponse;
import com.theragift.dto.practice.FeeUpdateRequest;
import com.theragift.service.FeeManagementService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * V2.2D: Toplu ücret güncelleme (zam yönetimi) uçları.
 *
 * NOT: GET/PUT /api/practice-settings kasıtlı olarak burada YOKTUR.
 * Klinik/pratik ayarları zaten mevcut PsychologistController üzerinden
 * /api/psychologist/profile ile okunup güncellenebiliyor (PsychologistProfile
 * V2.2D'de genişletildi). Aynı işlevi burada tekrar tanımlamak, iki farklı
 * "settings" kaynağı yaratıp karışıklığa yol açardı.
 */
@RestController
@RequestMapping("/api/practice-settings")
@RequiredArgsConstructor
public class PracticeSettingsController {

    private final FeeManagementService feeManagementService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/update-fees-preview")
    public FeeUpdatePreviewResponse previewFeeUpdate(@RequestBody FeeUpdateRequest request) {
        return feeManagementService.preview(currentUserProvider.getCurrentUser(), request);
    }

    @PostMapping("/apply-fee-update")
    public FeeUpdateApplyResponse applyFeeUpdate(@RequestBody FeeUpdateRequest request) {
        return feeManagementService.apply(currentUserProvider.getCurrentUser(), request);
    }
}
