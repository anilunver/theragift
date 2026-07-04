package com.theragift.service;

import com.theragift.dto.report.AppointmentReportResponse;
import com.theragift.dto.report.ClientReportLine;
import com.theragift.dto.report.FinancialReportResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.Client;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;
import com.theragift.enums.SessionType;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * V2.3: Raporlar (Reports) sayfası için özet hesaplamalar.
 * <p>
 * ÖNEMLİ: Ciro/tahsilat/borç kuralları burada YENİDEN İCAT EDİLMEDİ —
 * PaymentService ve ClientService'te (V2.2A.3'ten beri) zaten yerleşmiş olan
 * "CANCELLED ve NO_SHOW non-billable" kuralı birebir aynı şekilde uygulanır.
 * Bu, Reports sayfasındaki tutarların Payments sayfasındaki tutarlarla HER
 * ZAMAN tutarlı olmasını garanti eder.
 * <p>
 * Güvenlik: her metod User (psikolog) parametresi alır ve SADECE
 * AppointmentRepository/ClientRepository'nin zaten var olan
 * "psikolog bazlı" sorgularını kullanır — başka bir psikoloğun verisi asla
 * bu raporlara karışamaz.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;

    private static final String[] TR_DAY_LABELS = {
            "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"
    };

    public FinancialReportResponse getFinancialReport(User psychologist, LocalDate start, LocalDate end) {
        List<Appointment> appointments = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal collectedAmount = BigDecimal.ZERO;
        BigDecimal outstandingAmount = BigDecimal.ZERO;
        BigDecimal overdueAmount = BigDecimal.ZERO;
        BigDecimal partialPaidAmount = BigDecimal.ZERO;
        int sessionCount = 0;
        int cancelledCount = 0;
        int noShowCount = 0;
        int freeCount = 0;
        int packageCount = 0;
        LocalDate today = LocalDate.now();

        for (Appointment a : appointments) {
            if (a.getStatus() == AppointmentStatus.CANCELLED) {
                cancelledCount++;
                continue; // V2.2A.3 kuralı: non-billable, ciro/borca hiç dahil değil.
            }
            if (a.getStatus() == AppointmentStatus.NO_SHOW) {
                noShowCount++;
                continue;
            }

            PaymentStatus ps = a.getPaymentStatus();
            BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
            BigDecimal paid = a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal remaining = a.getRemainingAmount() != null ? a.getRemainingAmount() : fee.subtract(paid).max(BigDecimal.ZERO);

            if (ps == PaymentStatus.FREE) {
                freeCount++;
                sessionCount++;
                continue; // Ciro/tahsilat dışı, ayrı kategori.
            }
            if (ps == PaymentStatus.PACKAGE_USED) {
                packageCount++;
                sessionCount++;
                continue; // Ciro/tahsilat dışı, ayrı kategori.
            }
            if (ps == PaymentStatus.CANCELLED) {
                // Ödeme durumu "İptal Edildi" ise (AppointmentStatus farklı olsa bile)
                // tutarlılık için ciro/borca dahil edilmez — MonthlySummary ile aynı kural.
                continue;
            }

            sessionCount++;
            totalRevenue = totalRevenue.add(fee);
            collectedAmount = collectedAmount.add(paid);

            if (ps == PaymentStatus.PARTIAL_PAID) {
                partialPaidAmount = partialPaidAmount.add(remaining);
            }
            if (ps == PaymentStatus.UNPAID || ps == PaymentStatus.PAY_LATER || ps == PaymentStatus.PARTIAL_PAID) {
                outstandingAmount = outstandingAmount.add(remaining);
                if (a.getPaymentDueDate() != null && a.getPaymentDueDate().isBefore(today) && remaining.compareTo(BigDecimal.ZERO) > 0) {
                    overdueAmount = overdueAmount.add(remaining);
                }
            }
        }

        return FinancialReportResponse.builder()
                .totalRevenue(totalRevenue)
                .collectedAmount(collectedAmount)
                .outstandingAmount(outstandingAmount)
                .overdueAmount(overdueAmount)
                .partialPaidAmount(partialPaidAmount)
                .sessionCount(sessionCount)
                .cancelledCount(cancelledCount)
                .noShowCount(noShowCount)
                .freeCount(freeCount)
                .packageCount(packageCount)
                .build();
    }

    public AppointmentReportResponse getAppointmentReport(User psychologist, LocalDate start, LocalDate end) {
        List<Appointment> appointments = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end);

        int completedCount = 0;
        int cancelledCount = 0;
        int noShowCount = 0;
        int onlineCount = 0;
        int faceToFaceCount = 0;
        Map<DayOfWeek, Long> byDay = appointments.stream()
                .collect(Collectors.groupingBy(a -> a.getAppointmentDate().getDayOfWeek(), Collectors.counting()));
        Map<Integer, Long> byHour = appointments.stream()
                .collect(Collectors.groupingBy(a -> a.getStartTime().getHour(), Collectors.counting()));

        for (Appointment a : appointments) {
            if (a.getStatus() == AppointmentStatus.COMPLETED) completedCount++;
            if (a.getStatus() == AppointmentStatus.CANCELLED) cancelledCount++;
            if (a.getStatus() == AppointmentStatus.NO_SHOW) noShowCount++;
            if (a.getSessionType() == SessionType.ONLINE) onlineCount++;
            if (a.getSessionType() == SessionType.FACE_TO_FACE) faceToFaceCount++;
        }

        String busiestDay = byDay.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> TR_DAY_LABELS[e.getKey().getValue() - 1])
                .orElse(null);

        String busiestHour = byHour.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> "%02d:00-%02d:00".formatted(e.getKey(), e.getKey() + 1))
                .orElse(null);

        return AppointmentReportResponse.builder()
                .totalScheduled(appointments.size())
                .completedCount(completedCount)
                .cancelledCount(cancelledCount)
                .noShowCount(noShowCount)
                .onlineCount(onlineCount)
                .faceToFaceCount(faceToFaceCount)
                .busiestDayOfWeek(busiestDay)
                .busiestHourRange(busiestHour)
                .build();
    }

    public List<ClientReportLine> getClientReport(User psychologist, LocalDate start, LocalDate end) {
        List<Client> clients = clientRepository.findByPsychologistOrderByCreatedAtDesc(psychologist);
        LocalDate today = LocalDate.now();

        return clients.stream().map(client -> {
            List<Appointment> all = appointmentRepository.findByClient(client);
            List<Appointment> inRange = all.stream()
                    .filter(a -> !a.getAppointmentDate().isBefore(start) && !a.getAppointmentDate().isAfter(end))
                    .toList();

            int completedCount = (int) inRange.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
            int cancelledCount = (int) inRange.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
            int noShowCount = (int) inRange.stream().filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();

            BigDecimal collected = inRange.stream()
                    .filter(this::isBillable)
                    .map(a -> a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal remaining = inRange.stream()
                    .filter(this::isBillable)
                    .map(a -> a.getRemainingAmount() != null ? a.getRemainingAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LocalDate lastAppointmentDate = all.stream()
                    .filter(a -> !a.getAppointmentDate().isAfter(today))
                    .map(Appointment::getAppointmentDate)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            LocalDate nextAppointmentDate = all.stream()
                    .filter(a -> a.getAppointmentDate().isAfter(today) && a.getStatus() == AppointmentStatus.SCHEDULED)
                    .map(Appointment::getAppointmentDate)
                    .min(Comparator.naturalOrder())
                    .orElse(null);

            return ClientReportLine.builder()
                    .clientId(client.getId())
                    .clientFullName(client.getFirstName() + " " + client.getLastName())
                    .totalSessions(inRange.size())
                    .completedCount(completedCount)
                    .cancelledCount(cancelledCount)
                    .noShowCount(noShowCount)
                    .collectedAmount(collected)
                    .remainingAmount(remaining)
                    .lastAppointmentDate(lastAppointmentDate)
                    .nextAppointmentDate(nextAppointmentDate)
                    .active(client.isActive())
                    .build();
        }).toList();
    }

    private boolean isBillable(Appointment a) {
        return a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.NO_SHOW;
    }
}
