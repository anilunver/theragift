package com.theragift.dto.form;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormLinkResponse {
    private Long id;
    private String token;
    private String publicUrl;
    private String status;
}
