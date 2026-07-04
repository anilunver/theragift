package com.theragift.dto.practice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeUpdatePreviewResponse {
    private int affectedCount;
    private BigDecimal oldDefaultFee;
    private BigDecimal newFee;
    private List<FeeUpdateClientLine> clients;
}
