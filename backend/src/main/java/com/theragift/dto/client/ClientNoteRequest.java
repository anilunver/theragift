package com.theragift.dto.client;

import lombok.Data;

@Data
public class ClientNoteRequest {
    private String note;
    private Boolean pinned;
}
