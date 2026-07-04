package com.theragift.dto.form;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicFormViewResponse {
    private String token;
    private String status;
    private String psychologistName;
    private boolean alreadySubmitted;
}
