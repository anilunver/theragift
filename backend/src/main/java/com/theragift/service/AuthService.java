package com.theragift.service;

import com.theragift.dto.auth.AuthResponse;
import com.theragift.dto.auth.LoginRequest;
import com.theragift.dto.auth.RegisterRequest;
import com.theragift.entity.*;
import com.theragift.enums.Role;
import com.theragift.enums.SubscriptionStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.*;
import com.theragift.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PsychologistProfileRepository profileRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UsageQuotaRepository usageQuotaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Bu e-posta ile zaten bir hesap var", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.PSYCHOLOGIST)
                .active(true)
                .build();
        user = userRepository.save(user);

        PsychologistProfile profile = PsychologistProfile.builder()
                .user(user)
                .title("Uzm. Psk.")
                .specialty(request.getSpecialty() != null ? request.getSpecialty() : "Genel")
                .defaultSessionFee(BigDecimal.valueOf(1500))
                .defaultSessionDurationMinutes(50)
                .build();
        profileRepository.save(profile);

        // Demo / Gift License planına otomatik kaydet
        SubscriptionPlan giftPlan = planRepository.findByName("Gift License")
                .orElseGet(() -> planRepository.save(SubscriptionPlan.builder()
                        .name("Gift License")
                        .description("Ücretsiz hediye lisansı")
                        .price(BigDecimal.ZERO)
                        .durationDays(365)
                        .aiQuotaLimit(50)
                        .giftLicense(true)
                        .build()));

        Subscription subscription = Subscription.builder()
                .psychologist(user)
                .plan(giftPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(giftPlan.getDurationDays()))
                .build();
        subscriptionRepository.save(subscription);

        UsageQuota quota = UsageQuota.builder()
                .psychologist(user)
                .aiQuotaUsed(0)
                .aiQuotaLimit(giftPlan.getAiQuotaLimit())
                .build();
        usageQuotaRepository.save(quota);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("E-posta veya şifre hatalı", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException("E-posta veya şifre hatalı", HttpStatus.UNAUTHORIZED);
        }

        if (!user.isActive()) {
            throw new ApiException("Hesap pasif durumda", HttpStatus.FORBIDDEN);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
