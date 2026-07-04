package com.theragift.service;

import com.theragift.dto.psychologist.ProfileResponse;
import com.theragift.dto.psychologist.ProfileUpdateRequest;
import com.theragift.entity.PsychologistProfile;
import com.theragift.entity.User;
import com.theragift.repository.PsychologistProfileRepository;
import com.theragift.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PsychologistProfileService {

    private final PsychologistProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileResponse getProfile(User user) {
        PsychologistProfile profile = profileRepository.findByUser(user)
                .orElseGet(() -> profileRepository.save(PsychologistProfile.builder().user(user).build()));
        return toResponse(user, profile);
    }

    @Transactional
    public ProfileResponse updateProfile(User user, ProfileUpdateRequest request) {
        PsychologistProfile profile = profileRepository.findByUser(user)
                .orElseGet(() -> PsychologistProfile.builder().user(user).build());

        if (request.getTitle() != null) profile.setTitle(request.getTitle());
        if (request.getSpecialty() != null) profile.setSpecialty(request.getSpecialty());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getDefaultSessionFee() != null) profile.setDefaultSessionFee(request.getDefaultSessionFee());
        if (request.getDefaultPaymentMethod() != null) profile.setDefaultPaymentMethod(request.getDefaultPaymentMethod());
        if (request.getDefaultSessionDurationMinutes() != null)
            profile.setDefaultSessionDurationMinutes(request.getDefaultSessionDurationMinutes());

        profileRepository.save(profile);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
            userRepository.save(user);
        }

        return toResponse(user, profile);
    }

    private ProfileResponse toResponse(User user, PsychologistProfile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .title(profile.getTitle())
                .specialty(profile.getSpecialty())
                .phone(profile.getPhone())
                .bio(profile.getBio())
                .defaultSessionFee(profile.getDefaultSessionFee())
                .defaultPaymentMethod(profile.getDefaultPaymentMethod() != null ? profile.getDefaultPaymentMethod().name() : null)
                .defaultSessionDurationMinutes(profile.getDefaultSessionDurationMinutes())
                .build();
    }
}
