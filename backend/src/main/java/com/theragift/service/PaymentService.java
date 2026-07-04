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
                .stream().filter(this::isBillableAppointment).map(this::toResponse).toList();
    }

    /** Tahsil Edilecek: kalan borcu > 0 ve henüz vadesi geçmemiş UNPAID/PAY_LATER kayıtlar. */
    public List<AppointmentResponse> getToCollect(User psychologist) {
        LocalDate today = LocalDate.now();
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.UNPAID, PaymentStatus.PAY_LATER))
                .stream()
                .filter(this::isBillableAppointment)
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
                .filter(this::isBillableAppointment)
                .filter(this::hasRemainingDebt)
                .map(this::toResponse)
                .toList();
    }

    /** Kısmi Ödenen: hem ödenen hem kalan tutarı 0'dan büyük olan kayıtlar. */
    public List<AppointmentResponse> getPartial(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, List.of(PaymentStatus.PARTIAL_PAID))
                .stream()
                .filter(this::isBillableAppointment)
                .filter(a -> isPositive(a.getPaidAmount()) && hasRemainingDebt(a))
                .map(this::toResponse)
                .toList();
    }

    /** Ödenenler — sadece kalan borcu gerçekten 0 olan PAID kayıtlar; kayıp olmaz. */
    public List<AppointmentResponse> getPaid(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist, List.of(PaymentStatus.PAID))
                .stream()
                .filter(this::isBillableAppointment)
                .filter(a -> !hasRemainingDebt(a))
                .map(this::toResponse)
                .toList();
    }

    /** Paket / Ücretsiz seanslar — nakit tahsilat veya borç sayılmaz. */
    public List<AppointmentResponse> getPackageOrFree(User psychologist) {
        return appointmentRepository.findByPsychologistAndPaymentStatusIn(psychologist,
                        List.of(PaymentStatus.PACKAGE_USED, PaymentStatus.FREE))
                .stream()
                .filter(this::isBillableAppointment)
                .map(this::toResponse).toList();
    }

    /**
     * İptal Edilenler — AppointmentStatus = CANCELLED kayıtlar.
     * ÖNEMLİ: bu AppointmentStatus.CANCELLED'a göre filtreler, PaymentStatus.CANCELLED'a
     * göre DEĞİL — bu iki alan bağımsızdır (bir randevu appointment olarak iptal
     * edilmeden de ödeme durumu "İptal Edildi" olarak işaretlenebilir, ya da tam tersi).
     */
    public List<AppointmentResponse> getCancelled(User psychologist) {
        return appointmentRepository.findByPsychologistAndStatus(psychologist, AppointmentStatus.CANCELLED)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Gelmeyenler — AppointmentStatus = NO_SHOW kayıtlar. Ödeme durumu ne olursa
     * olsun (UNPAID/PAY_LATER borçlu kalabilir, FREE borçsuzdur, PAID tahsil
     * edilmiş sayılır) burada listelenir — sekme sadece randevu durumuna bakar,
     * ödeme durumu rozet olarak ayrıca gösterilir.
     */
    public List<AppointmentResponse> getNoShow(User psychologist) {
        return appointmentRepository.findByPsychologistAndStatus(psychologist, AppointmentStatus.NO_SHOW)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Aylık Ciro / Tahsil Edilen / Tahsil Edilmeyen hesap kuralı (V2.2A.3):
     * - AppointmentStatus = CANCELLED veya NO_SHOW olan randevular TAMAMEN hariç
     *   (non-billable — MVP kuralı: "seans gerçekleşmedi = ciro/borç dışı").
     *   Bu, PaymentStatus'tan BAĞIMSIZ bir kontroldür.
     * - Ödeme durumu FREE veya PACKAGE_USED ise cirodan ve borçtan hariç
     *   (paket/ücretsiz nakit tahsilat sayılmaz).
     * - PAID: ödenen tutar tahsil edilene, ücret ciroya eklenir.
     * - PARTIAL_PAID: ödenen tahsil edilene, kalan tahsil edilmeyene eklenir.
     * - UNPAID / PAY_LATER: kalan borç varsa tahsil edilmeyene eklenir.
     * - "Toplam Seans" artık sadece aktif/ücretlendirilebilir (billable) seansları
     *   sayar — CANCELLED ve NO_SHOW hiç sayılmaz.
     */
    public MonthlySummaryResponse getMonthlySummary(User psychologist) {
        YearMonth ym = YearMonth.now();
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Appointment> monthly = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end)
                .stream()
                .filter(this::isBillableAppointment)
                .toList();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDeci