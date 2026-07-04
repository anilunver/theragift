package com.theragift.service;

import com.theragift.dto.dashboard.DashboardSummaryResponse;
import com.theragift.dto.payment.MonthlySummaryResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.User;
import com.theragift.entity.WorkingHour;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.AvailabilityFormStatus;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.AvailabilityFormRepository;
import com.theragift.repository.WorkingHourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppointmentRepository appointmentRepository;
    private final WorkingHourRepository workingHourRepository;
    private final AvailabilityFormRepository formRepository;
    private final PaymentService paymentService;
    private final SubscriptionService subscriptionService;

    // V2.2A.1: SuggestionService ile tutarlı olsun diye 50 -> 60 ve tam saate
    // hizalama (bkz. computeAvailableSlotsToday) — "Boş Slot" sayısı artık
    // Öneriler ekranının önerebileceği gerçek slot sayısını yansıtır.
    private static final int SLOT_MINUTES = 60;

    public DashboardSummaryResponse getSummary(User psychologist) {
        LocalDate today = LocalDate.now();

        // V2.2A.3: "Toplam Seans" (todayAppointmentsCount) yalnızca aktif/
        // ücretlendirilebilir (billable) seansları sayar — CANCELLED ve NO_SHOW
        // hariç tutulur (Payments tarafındaki isBillableAppointment kuralıyla
        // tutarlı olsun diye).
        List<Appointment> todayAppointments = appointmentRepository
                .findByPsychologistAndAppointmentDate(psychologist, today)
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.NO_SHOW)
                .toList();

        BigDecimal todayRevenue = todayAppointments.stream()
                .map(a -> a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Dashboard, Payments sayfasıyla aynı sayılara sahip olsun diye aynı
        // PaymentService metodlarını (getToCollect/getOverdue) kullanır.
        BigDecimal unpaidAmount = paymentService.getToCollect(psychologist).stream()
                .map(a -> a.getRemainingAmount() != null ? a.getRemainingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(paymentService.getOverdue(psychologist).stream()
                        .map(a -> a.getRemainingAmount() != null ? a.getRemainingAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        int overdueCount = paymentService.getOverdue(psychologist).size();

        int pendingForms = formRepository.findByPsychologistAndStatusOrderByCreatedAtDesc(
                psychologist, AvailabilityFormStatus.PENDING).size();

        int availableSlots = computeAvailableSlotsToday(psychologist, today, todayAppointments);

        MonthlySummaryResponse monthly = paymentService.getMonthlySummary(psychologist);

        var subscription = subscriptionService.getCurrent(psychologist);

        return DashboardSummaryResponse.builder()
                .todayAppointmentsCount(todayAppointments.size())
                .availableSlotsCount(availableSlots)
                .pendingFormsCount(pendingForms)
                .todayRevenue(todayRevenue)
                .unpaidAmount(unpaidAmount)
                .overduePaymentsCount(overdueCount)
                .monthlyRevenue(monthly.getTotalRevenue())
                .giftLicenseActive(subscription.isGiftLicense())
                .aiQuotaUsed(subscription.getAiQuotaUsed())
                .aiQuotaLimit(subscription.getAiQuotaLimit())
                .build();
    }

    private int computeAvailableSlotsToday(User psychologist, LocalDate today, List<Appointment> todayAppointments) {
        List<WorkingHour> hours = workingHourRepository.findByPsychologistAndDayOfWeekAndActiveTrue(
                psychologist, today.getDayOfWeek());

        int count = 0;
        for (WorkingHour wh : hours) {
            // Tam saate hizala (SuggestionService ile aynı kural).
            LocalTime cursor = wh.getStartTime().getMinute() == 0
                    ? wh.getStartTime()
                    : wh.getStartTime().plusMinutes(60 - wh.getStartTime().getMinute());
            while (!cursor.plusMinutes(SLOT_MINUTES).isAfter(wh.getEndTime())) {
                LocalTime slotStart = cursor;
                LocalTime slotEnd = cursor.plusMinutes(SLOT_MINUTES);

                boolean inBreak = wh.getBreakStartTime() != null && wh.getBreakEndTime() != null
                        && slotStart.isBefore(wh.getBreakEndTime()) && slotEnd.isAfter(wh.getBreakStartTime());

                boolean conflicts = todayAppointments.stream().anyMatch(a ->
                        slotStart.isBefore(a.getEndTime()) && slotEnd.isAfter(a.getStartTime()));

                boolean isPast = slotStart.isBefore(LocalTime.now());

                if (!inBreak && !conflicts && !isPast) {
                    count++;
                }
                cursor = cursor.plusMinutes(SLOT_MINUTES);
            }
        }
        return count;
    }
}
