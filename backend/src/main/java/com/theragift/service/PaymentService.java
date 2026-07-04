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

    /** Tahsil Edilecek: kalan borcu > 0 ve henüz vadesi geçmemiş UNPAID/PAY_LATER kayıtlar. */
    public List<AppointmentResponse> getToCollect(User psychologist) {
        LocalDate today = LocalDate.now();
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.UNPAID, PaymentStatus.PAY_LATER))
                .stream()
                .filter(this::isNotCancelledAppointment)
                .filter(this::hasRemainingDebt)
                .filter(a -> a.getPaymentDueDate() == null || !a.getPaymentDueDate().isBefore(today))
                .map(this::toResponse)
                .toList();
    }

    /** Geciken: kalan borcu > 0 ve son ödeme tarihi geçmiş kayıtlar. */
    public List<AppointmentResponse> getOverdue(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentDueDateBeforeAndPaymentStatusIn(
                        psychologist, LocalDate.now(), OUTSTANDING_STATUSES)
                .stream()
                .filter(this::isNotCancelledAppointment)
                .filter(this::hasRemainingDebt)
                .map(this::toResponse)
                .toList();
    }

    /** Kısmi Ödenen: hem ödenen hem kalan tutarı 0'dan büyük olan kayıtlar. */
    public List<AppointmentResponse> getPartial(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, List.of(PaymentStatus.PARTIAL_PAID))
                .stream()
                .filter(this::isNotCancelledAppointment)
                .filter(a -> isPositive(a.getPaidAmount()) && hasRemainingDebt(a))
                .map(this::toResponse)
                .toList();
    }

    /** Ödenenler — sadece kalan borcu gerçekten 0 olan PAID kayıtlar; kayıp olmaz. */
    public List<AppointmentResponse> getPaid(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, List.of(PaymentStatus.PAID))
                .stream()
                .filter(a -> !hasRemainingDebt(a))
                .map(this::toResponse)
                .toList();
    }

    /** Paket / Ücretsiz seanslar — nakit tahsilat veya borç sayılmaz. */
    public List<AppointmentResponse> getPackageOrFree(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.PACKAGE_USED, PaymentStatus.FREE))
                .stream().map(this::toResponse).toList();
    }

    /**
     * Aylık Ciro / Tahsil Edilen / Tahsil Edilmeyen hesap kuralı:
     * - İptal edilen randevu (appointment status CANCELLED) tamamen hariç.
     * - Ödeme durumu FREE, PACKAGE_USED veya CANCELLED ise cirodan ve borçtan hariç
     *   (paket/ücretsiz nakit tahsilat sayılmaz, iptal edilen ödeme borç sayılmaz).
     * - PAID: ödenen tutar tahsil edilene, ücret ciroya eklenir.
     * - PARTIAL_PAID: ödenen tahsil edilene, kalan tahsil edilmeyene eklenir.
     * - UNPAID / PAY_LATER / NO_SHOW (ödeme durumu): kalan borç varsa tahsil
     *   edilmeyene eklenir; NO_SHOW tek başına ciroyu sıfırlamaz, gerçek
     *   paid/remaining değerlerine göre hesaplanır.
     */
    public MonthlySummaryResponse getMonthlySummary(User psychologist) {
        YearMonth ym = YearMonth.now();
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Appointment> monthly = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end)
                .stream()
                .filter(this::isNotCancelledAppointment)
                .toList();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;
        int paidCount = 0;
        int unpaidCount = 0;
        int countedAppointments = 0;

        for (Appointment a : monthly) {
            PaymentStatus ps = a.getPaymentStatus();

            // Ücretsiz / paketten düşülen / ödeme durumu iptal olanlar cirodan ve
            // borçtan tamamen hariç tutulur.
            if (ps == PaymentStatus.FREE || ps == PaymentStatus.PACKAGE_USED || ps == PaymentStatus.CANCELLED) {
                continue;
            }

            countedAppointments++;
            BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
            BigDecimal paid = a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal remaining = a.getRemainingAmount() != null ? a.getRemainingAmount() : fee.subtract(paid).max(BigDecimal.ZERO);

            totalRevenue = totalRevenue.add(fee);
            totalPaid = totalPaid.add(paid);

            if (ps == PaymentStatus.PAID) {
                paidCount++;
            } else if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                // UNPAID, PAY_LATER, PARTIAL_PAID, NO_SHOW (kalan borcu olan her durum)
                unpaidCount++;
                totalUnpaid = totalUnpaid.add(remaining);
            }
        }

        return MonthlySummaryResponse.builder()
                .year(ym.getYear())
                .month(ym.getMonthValue())
                .totalRevenue(totalRevenue)
                .totalPaid(totalPaid)
                .totalUnpaid(totalUnpaid)
                .totalAppointments(countedAppointments)
                .paidCount(paidCount)
                .unpaidCount(unpaidCount)
                .build();
    }

    private boolean isNotCancelledAppointment(Appointment a) {
        return a.getStatus() != AppointmentStatus.CANCELLED;
    }

    private boolean hasRemainingDebt(Appointment a) {
        return a.getRemainingAmount() != null && a.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0;
    }

    private boolean isPositive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
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
