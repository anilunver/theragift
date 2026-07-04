package com.theragift.dto.psychologist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String title;
    private String specialty;
    private String phone;
    private String bio;
    private BigDecimal defaultSessionFee;
    private String defaultPaymentMethod;
    private Integer defaultSessionDurationMinutes;

 