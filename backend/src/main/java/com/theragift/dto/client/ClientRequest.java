package com.theragift.dto.client;

import com.theragift.enums.PaymentMethod;
import com.theragift.enums.SessionType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ClientRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private SessionType sessionTypePreference;
    private String availabilityNotes;
    private BigDecimal defaultSessionFee;
    private PaymentMethod defaultPaymentMethod;
    private String notes;
    private Boolean active;
}
