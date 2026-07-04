package com.theragift.service;

import com.theragift.dto.dashboard.DashboardSummaryResponse;
import com.theragift.dto.payment.MonthlySummaryResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.User;
import com.theragift.entity.WorkingHour;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.AvailabilityFormStatus;
import com.theragift.enums.PaymentStatus;
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

    private static final int SLOT_MINUTES = 50;

    public DashboardSummaryResponse getSummary(User psychologist) {
        LocalDate today = LocalDate.now();

        List<Appointment> todayAppointments = appointmentRepository
                .findByPsychologistAndAppointmentDate(psychologist, today)
                .stream().filter(a -> a.getStatus() != AppointmentStatus.CANCELLED).toList();

        BigDecimal todayRevenue = todayAppointments.stream()
                .map(a -> a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal unpaidAmount = appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.UNPAID, PaymentStatus.PARTIAL_PAID, PaymentStatus.PAY_LATER))
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED) // iptal edilen randevu borç sayılmaz
                .map(a -> {
                    BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
                    BigDecimal paid = a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO;
                    return fee.subtract(paid);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int overdueCount = (int) appointmentRepository.findByPsychologistAndPaymentDueDateBeforeAndPaymentStatusIn(
                psychologist, today, List.of(PaymentStatus.UNPAID, PaymentStatus.PARTIAL_PAID, PaymentStatus.PAY_LATER)
        ).stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .filter(a -> a.getRemainingAmount() != null && a.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                .count();

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
            LocalTime cursor = wh.getStartTime();
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
