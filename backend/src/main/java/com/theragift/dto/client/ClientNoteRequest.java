package com.theragift.dto.client;

import com.theragift.enums.ClientNoteCategory;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ClientNoteRequest {
    private String title;
    private String content;
    private ClientNoteCategory category;
    private Boolean pinned;
    private Long appointmentId;
    private LocalDate sessionDate;
}
