package com.theragift.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientNoteResponse {
    private Long id;
    private Long clientId;
    private String title;
    private String content;
    private String category;
    private boolea