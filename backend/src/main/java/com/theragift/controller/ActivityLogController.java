package com.theragift.controller;

import com.theragift.dto.activity.ActivityLogResponse;
import com.theragift.service.ActivityLogService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * V2.3: İşlem Geçmişi (Activity Log). Her zaman sadece giriş yapmış psikoloğun
 * kendi kayıtlarını döner (CurrentUserProvider ile). Ya limit bazlı ("son N
 * işlem" — Dashboard'daki "Son İşlemler" kartı için) ya da tarih aralığı bazlı
 * (Reports sayfasındaki "İşlem Geçmişi" sekmesi için) sorgulanabilir.
 */
@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<ActivityLogResponse> getActivityLogs(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        var psychologist = currentUserProvider.getCurrentUser();
        if (startDate != null && endDate != null) {
            return activityLogService.getByRange(psychologist, startDate, endDate);
        }
        return activityLogService.getRecent(psychologist, limit != null ? limit : 50);
    }
}
