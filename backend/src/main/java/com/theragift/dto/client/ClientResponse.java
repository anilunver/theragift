package com.theragift.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String sessionTypePreference;
    private String availabilityNotes;
    private BigDecimal defaultSessionFee;
    private String defaultPaymentMethod;
    private String notes;
    private boolean active;
    private LocalDateTime createdAt;
}
