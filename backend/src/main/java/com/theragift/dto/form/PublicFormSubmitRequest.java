package com.theragift.dto.form;

import lombok.Data;

@Data
public class PublicFormSubmitRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String preferredDays;
    private String preferredTimeRange;
    private String notes;
}
