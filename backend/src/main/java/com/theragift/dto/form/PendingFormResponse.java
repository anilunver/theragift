package com.theragift.dto.form;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingFormResponse {
    private Long id;
    private String token;
    private String status;
    private String clientFullName;
    private String preferredDays;
    private String preferredTimeRange;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime submittedAt;
}
