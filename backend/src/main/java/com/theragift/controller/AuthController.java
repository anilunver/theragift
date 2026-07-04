package com.theragift.controller;

import com.theragift.dto.auth.AuthResponse;
import com.theragift.dto.auth.LoginRequest;
import com.theragift.dto.auth.RegisterRequest;
import com.theragift.dto.auth.UserResponse;
import com.theragift.entity.User;
import com.theragift.service.AuthService;
import com.theragift.util.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        User user = currentUserProvider.getCurrentUser();
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .active(user.isActive())
                .build();
    }
}
