package com.theragift.controller;

import com.theragift.dto.report.AppointmentReportResponse;
import com.theragift.dto.report.ClientReportLine;
import com.theragift.dto.report.FinancialReportResponse;
import com.theragift.exception.ApiException;
import com.theragift.service.ReportService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * V2.3: Raporlar (Reports) sayfası endpoint'leri. Her uç, sadece giriş yapmış
 * psikoloğun kendi verisini döner (CurrentUserProvider + mevcut repository
 * sorgularının psikolog bazlı filtrelemesi sayesinde).
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/financial")
    public FinancialReportResponse getFinancial(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate[] range = resolveRange(startDate, endDate);
        return reportService.getFinancialReport(currentUserProvider.getCurrentUser(), range[0], range[1]);
    }

    @GetMapping("/appointments")
    public AppointmentReportResponse getAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate[] range = resolveRange(startDate, endDate);
        return reportService.getAppointmentReport(currentUserProvider.getCurrentUser(), range[0], range[1]);
    }

    @GetMapping("/clients")
    public List<ClientReportLine> getClients(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate[] range = resolveRange(startDate, endDate);
        return reportService.getClientReport(currentUserProvider.getCurrentUser(), range[0], range[1]);
    }

    // Frontend her zaman startDate/endDate göndermeli (varsayılan "Bu ay" seçili
    // tarih filtresinden). Bu, eksik/hatalı bir istek durumunda güvenlik ağı olarak
    // sunucu tarafında "bu ay"a düşer.
    private LocalDate[] resolveRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            if (startDate.isAfter(endDate)) {
                throw new ApiException("Başlangıç tarihi bitiş tarihinden sonra olamaz.", HttpStatus.BAD_REQUEST);
            }
            return new LocalDate[]{startDate, endDate};
        }
        YearMonth currentMonth = YearMonth.now();
        return new LocalDate[]{currentMonth.atDay(1), currentMonth.atEndOfMonth()};
    }
}
