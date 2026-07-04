package com.theragift.service;

import com.theragift.dto.practice.FeeUpdateApplyResponse;
import com.theragift.dto.practice.FeeUpdateClientLine;
import com.theragift.dto.practice.FeeUpdatePreviewResponse;
import com.theragift.dto.practice.FeeUpdateRequest;
import com.theragift.entity.Client;
import com.theragift.entity.PsychologistProfile;
import com.theragift.entity.User;
import com.theragift.enums.FeeUpdateTargetMode;
import com.theragift.exception.ApiException;
import com.theragift.repository.ClientRepository;
import com.theragift.repository.PsychologistProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * V2.2D: Toplu ücret güncelleme / zam yönetimi.
 *
 * ÇOK ÖNEMLİ KURALLAR:
 * - Sadece Client.defaultSessionFee güncellenir.
 * - Geçmiş Appointment.sessionFee değerleri ASLA değiştirilmez.
 * - Mevcut oluşturulmuş randevuların ücretleri değişmez.
 * - Sadece bundan sonra oluşturulacak yeni randevular yeni ücreti kullanır
 *   (çünkü AppointmentService.create() ücreti Client.defaultSessionFee'den okur).
 * - PsychologistProfile.defaultSessionFee de güncellenir (yeni danışan/pratik varsayılanı için).
 */
@Service
@RequiredArgsConstructor
public class FeeManagementService {

    private final ClientRepository clientRepository;
    private final PsychologistProfileRepository profileRepository;
    private final ActivityLogService activityLogService;

    public FeeUpdatePreviewResponse preview(User psychologist, FeeUpdateRequest request) {
        validateRequest(request);
        PsychologistProfile profile = getOrCreateProfile(psychologist);
        BigDecimal oldDefaultFee = profile.getDefaultSessionFee();

        List<Client> targets = resolveTargetClients(psychologist, request, oldDefaultFee);

        List<FeeUpdateClientLine> lines = targets.stream()
                .sorted(Comparator.comparing(Client::getFirstName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(c -> FeeUpdateClientLine.builder()
                        .clientId(c.getId())
                        .clientFullName(((c.getFirstName() != null ? c.getFirstName() : "") + " "
                                + (c.getLastName() != null ? c.getLastName() : "")).trim())
                        .oldFee(c.getDefaultSessionFee())
                        .newFee(request.getNewFee())
                        .build())
                .collect(Collectors.toList());

        return FeeUpdatePreviewResponse.builder()
                .affectedCount(lines.size())
                .oldDefaultFee(oldDefaultFee)
                .newFee(request.getNewFee())
                .clients(lines)
                .build();
    }

    @Transactional
    public FeeUpdateApplyResponse apply(User psychologist, FeeUpdateRequest request) {
        validateRequest(request);
        PsychologistProfile profile = getOrCreateProfile(psychologist);
        BigDecimal oldDefaultFee = profile.getDefaultSessionFee();

        List<Client> targets = resolveTargetClients(psychologist, request, oldDefaultFee);

        // Sadece client.defaultSessionFee güncellenir. Appointment kayıtlarına DOKUNULMAZ.
        for (Client c : targets) {
            c.setDefaultSessionFee(request.getNewFee());
        }
        clientRepository.saveAll(targets);

        profile.setDefaultSessionFee(request.getNewFee());
        profileRepository.save(profile);

        activityLogService.log(psychologist, "FEE_UPDATE_APPLIED", "PRACTICE_SETTINGS", profile.getId(),
                targets.size() + " danışanın varsayılan ücreti güncellendi.");

        return FeeUpdateApplyResponse.builder()
                .updatedCount(targets.size())
                .build();
    }

    private List<Client> resolveTargetClients(User psychologist, FeeUpdateRequest request, BigDecimal oldDefaultFee) {
        List<Client> all = clientRepository.findByPsychologistOrderByCreatedAtDesc(psychologist);

        List<Client> targets;
        if (request.getTargetMode() == FeeUpdateTargetMode.MANUAL) {
            if (request.getClientIds() == null || request.getClientIds().isEmpty()) {
                throw new ApiException("Manuel seçim için en az bir danışan seçilmelidir.", HttpStatus.BAD_REQUEST);
            }
            Set<Long> ids = new HashSet<>(request.getClientIds());
            targets = all.stream()
                    .filter(c -> ids.contains(c.getId()))
                    .collect(Collectors.toList());
        } else if (request.getTargetMode() == FeeUpdateTargetMode.EQUAL_TO_OLD) {
            targets = all.stream()
                    .filter(Client::isActive)
                    .filter(c -> c.getDefaultSessionFee() != null
                            && oldDefaultFee != null
                            && c.getDefaultSessionFee().compareTo(oldDefaultFee) == 0)
                    .collect(Collectors.toList());
        } else {
            // ALL_ACTIVE (varsayılan)
            targets = all.stream()
                    .filter(Client::isActive)
                    .collect(Collectors.toList());
        }

        if (request.getExcludeClientIds() != null && !request.getExcludeClientIds().isEmpty()) {
            Set<Long> excluded = new HashSet<>(request.getExcludeClientIds());
            targets = targets.stream()
                    .filter(c -> !excluded.contains(c.getId()))
                    .collect(Collectors.toList());
        }

        return targets;
    }

    private void validateRequest(FeeUpdateRequest request) {
        if (request.getNewFee() == null || request.getNewFee().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Geçerli bir ücret giriniz.", HttpStatus.BAD_REQUEST);
        }
        if (request.getTargetMode() == null) {
            throw new ApiException("Hedef danışan grubu seçilmelidir.", HttpStatus.BAD_REQUEST);
        }
    }

    pr