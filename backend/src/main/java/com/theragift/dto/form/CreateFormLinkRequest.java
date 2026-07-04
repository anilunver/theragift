package com.theragift.dto.form;

import lombok.Data;

@Data
public class CreateFormLinkRequest {
    private Long clientId; // opsiyonel, var olan danışan için özel link
}
