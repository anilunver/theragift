package com.theragift.dto.unavailable;

import com.theragift.enums.UnavailableBlockType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class UnavailableBlockRequest {
    private String title;
    private UnavailableBlockType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean fullDay;
    private LocalTime startTime;
    private LocalTime endTime;
    private String note;
}
