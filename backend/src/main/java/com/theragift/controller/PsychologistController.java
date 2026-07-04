package com.theragift.controller;

import com.theragift.dto.psychologist.ProfileResponse;
import com.theragift.dto.psychologist.ProfileUpdateRequest;
import com.theragift.entity.User;
import com.theragift.service.PsychologistProfileService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/psychologist")
@RequiredArgsConstructor
public class PsychologistController {

    private final PsychologistProfileService profileService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/profile")
    public ProfileResponse getProfile() {
        User user = currentUserProvider.getCurrentUser();
        return profileService.getProfile(user);
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(@RequestBody ProfileUpdateRequest request) {
        User user = currentUserProvider.getCurrentUser();
        return profileService.updateProfile(user, request);
    }
}
