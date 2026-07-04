package com.theragift.service;

import com.theragift.dto.appointment.AppointmentResponse;
import com.theragift.dto.payment.MonthlySummaryResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.User;
import com.theragift.enums.PaymentStatus;
import com.theragift.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final AppointmentRepository appointmentRepository;

    private static final List<PaymentStatus> OUTSTANDING_STATUSES =
            List.of(PaymentStatus.UNPAID, PaymentStatus.PARTIAL_PAID, PaymentStatus.PAY_LATER);

    public List<AppointmentResponse> getUnpaid(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, OUTSTANDING_STATUSES)
                .stream().map(this::toResponse).toList();
    }

    public List<AppointmentResponse> getOverdue(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentDueDateBeforeAndPaymentStatusIn(
                        psychologist, LocalDate.now(), OUTSTANDING_STATUSES)
                .stream().map(this::toResponse).toList();
    }

    public MonthlySummaryResponse getMonthlySummary(User psychologist) {
        YearMonth ym = YearMonth.now();
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Appointment> monthly = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;
        int paidCount = 0;
        int unpaidCount = 0;

        for (Appointment a : monthly) {
            BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
            BigDecimal paid = a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(fee);
            totalPaid = totalPaid.add(paid);
            if (a.getPaymentStatus() == PaymentStatus.PAID) {
                paidCount++;
            } else if (OUTSTANDING_STATUSES.contains(a.getPaymentStatus())) {
                unpaidCount++;
                totalUnpaid = totalUnpaid.add(fee.subtract(paid));
            }
        }

        return MonthlySummaryResponse.builder()
                .year(ym.getYear())
                .month(ym.getMonthValue())
                .totalRevenue(totalRevenue)
                .totalPaid(totalPaid)
                .totalUnpaid(totalUnpaid)
                .totalAppointments(monthly.size())
                .paidCount(paidCount)
                .unpaidCount(unpaidCount)
                .build();
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .clientId(a.getClient().getId())
                .clientFullName(a.getClient().getFirstName() + " " + a.getClient().getLastName())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .sessionType(a.getSessionType().name())
                .status(a.getStatus().name())
                .notes(a.getNotes())
                .sessionFee(a.getSessionFee())
                .paymentStatus(a.getPaymentStatus().name())
                .paymentMethod(a.getPaymentMethod() != null ? a.getPaymentMethod().name() : null)
                .paidAmount(a.getPaidAmount())
                .remainingAmount(a.getRemainingAmount())
                .paymentDate(a.getPaymentDate())
                .paymentDueDate(a.getPaymentDueDate())
                .paymentNote(a.getPaymentNote())
                .build();
    }
}
