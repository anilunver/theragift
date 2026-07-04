package com.theragift.dto.practice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeUpdateClientLine {
    private Long clientId;
    private String clientFullName;
    private BigDecimal oldFee;
    private BigDecimal newFee;
}
