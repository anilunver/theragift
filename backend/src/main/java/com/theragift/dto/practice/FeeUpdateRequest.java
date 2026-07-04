package com.theragift.dto.practice;

import com.theragift.enums.FeeUpdateTargetMode;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class FeeUpdateRequest {
    private BigDecimal newFee;
    private FeeUpdateTargetMode targetMode;
    // Sadece targetMode = MANUAL iken kullanılır.
    private List<Long> clientIds;
    // Opsiyonel: herhangi bir modda, belirtilen danışanları güncellemeden hariç tutar.
    private List<Long> excludeClientIds;
}
