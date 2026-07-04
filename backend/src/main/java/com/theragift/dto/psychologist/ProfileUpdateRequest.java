package com.theragift.dto.psychologist;

import com.theragift.enums.PaymentMethod;
import com.theragift.enums.SessionType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String title;
    private String specialty;
    private String phone;
    private String bio;
    private BigDecimal defaultSessionFee;
    private PaymentMethod defaultPaymentMethod;
    private Integer defaultSessionDurationMinutes;

    // --- V2.2D: Klinik / Pratik Ayarları (PracticeSettings) ---
    private String clinicName;
    private SessionType defaultSessionType;
    private Integer defaultBufferMinutes;
    private String currency;
    private String practiceNotes;
}
