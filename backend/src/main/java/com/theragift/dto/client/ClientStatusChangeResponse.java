package com.theragift.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientStatusChangeResponse {
    private ClientResponse client;
    // V2.2D.1: cancelFutureAppointments=true ile pasif yapıldığında kaç randevunun
    // CANCELLED yapıldığını gösterir. Diğer tüm durumlarda 0'dır.
    private int cancelledAppointmentsCount;
}
