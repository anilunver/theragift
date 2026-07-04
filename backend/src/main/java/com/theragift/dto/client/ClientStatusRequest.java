package com.theragift.dto.client;

import lombok.Data;

@Data
public class ClientStatusRequest {
    private Boolean active;

    // V2.2D.1: Danışan pasif yapılırken (active=false), true gönderilirse bugünden
    // sonraki SCHEDULED randevuları da CANCELLED yapılır. Danışan tekrar aktif
    // yapılırken (active=true) bu alan hiçbir şekilde dikkate alınmaz.
    private Boolean cancelFutureAppointments;
}
