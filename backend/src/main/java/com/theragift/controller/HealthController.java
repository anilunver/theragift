package com.theragift.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * V2.4: Deployment readiness için minimal, auth gerektirmeyen health-check
 * endpoint'i. Bilinçli olarak SADECE sabit, hassas olmayan bilgi döner —
 * veritabanı bağlantı durumu, secret, internal path veya kullanıcı verisi
 * KESİNLİKLE dönülmez. Bu endpoint sadece "uygulama ayakta mı" sorusuna
 * cevap verir; production ortamında load balancer / uptime monitoring
 * tarafından kullanılabilir.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> health() {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("app", "TheraGift");
        body.put("version", "V2.4");
        return body;
    }
}
