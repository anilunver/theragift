package com.theragift.service;

import com.theragift.dto.appointment.AppointmentResponse;
import com.theragift.dto.payment.MonthlySummaryResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
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

    // Borç sayılabilecek ("tahsil edilecek" ailesindeki) ödeme durumları
    private static final List<PaymentStatus> OUTSTANDING_STATUSES =
            List.of(PaymentStatus.UNPAID, PaymentStatus.PARTIAL_PAID, PaymentStatus.PAY_LATER);

    /** Geriye dönük uyumluluk için korunuyor: tüm "tahsil edilecek ailesi" (geciken dahil). */
    public List<AppointmentResponse> getUnpaid(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, OUTSTANDING_STATUSES)
                .stream().filter(this::isNotCancelledAppointment).map(this::toResponse).toList();
    }

    /** Tahsil Edilecek: ödenmemiş veya "sonra ödenecek" ama henüz vadesi geçmemiş. */
    public List<AppointmentResponse> getToCollect(User psychologist) {
        LocalDate today = LocalDate.now();
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.UNPAID, PaymentStatus.PAY_LATER))
                .stream()
                .filter(this::isNotCancelledAppointment)
                .filter(a -> a.getPaymentDueDate() == null || !a.getPaymentDueDate().isBefore(today))
                .map(this::toResponse)
                .toList();
    }

    /** Geciken: son ödeme tarihi geçmiş ve kalan borcu olan seanslar. */
    public List<AppointmentResponse> getOverdue(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentDueDateBeforeAndPaymentStatusIn(
                        psychologist, LocalDate.now(), OUTSTANDING_STATUSES)
                .stream()
                .filter(this::isNotCancelledAppointment)
                .filter(a -> a.getRemainingAmount() != null && a.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                .map(this::toResponse)
                .toList();
    }

    /** Kısmi Ödenen. */
    public List<AppointmentResponse> getPartial(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, List.of(PaymentStatus.PARTIAL_PAID))
                .stream().filter(this::isNotCancelledAppointment).map(this::toResponse).toList();
    }

    /** Ödenenler — tamamen ödenmiş olsa da listeden kaybolmaz. */
    public List<AppointmentResponse> getPaid(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, List.of(PaymentStatus.PAID))
                .stream().map(this::toResponse).toList();
    }

    /** Paket / Ücretsiz seanslar — nakit tahsilat veya borç sayılmaz. */
    public List<AppointmentResponse> getPackageOrFree(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.PACKAGE_USED, PaymentStatus.FREE))
                .stream().map(this::toResponse).toList();
    }

    public MonthlySummaryResponse getMonthlySummary(User psychologist) {
        YearMonth ym = YearMonth.now();
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Appointment> monthly = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end)
                .stream()
                .filter(this::isNotCancelledAppointment) // İptal edilen randevular ciroya/tahsilata dahil edilmez
                .toList();

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

    private boolean isNotCancelledAppointment(Appointment a) {
        return a.getStatus() != AppointmentStatus.CANCELLED;
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
