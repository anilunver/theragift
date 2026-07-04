package com.theragift.util;

import com.theragift.entity.Appointment;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;

import java.math.BigDecimal;

/**
 * Bir randevunun paidAmount/remainingAmount alanlarını paymentStatus ile tutarlı
 * hale getirir. Hem canlı ödeme güncellemesinde hem de eski/tutarsız verileri
 * düzeltmek için başlangıçta (PaymentNormalizationRunner) kullanılır.
 */
public final class PaymentNormalizer {

    private PaymentNormalizer() {
    }

    /** Alanlar değiştirildiyse true döner. */
    public static boolean normalize(Appointment a) {
        BigDecimal fee = a.getSessionFee() != null ? a.getSessionFee() : BigDecimal.ZERO;
        BigDecimal paid = a.getPaidAmount() != null ? a.getPaidAmount() : BigDecimal.ZERO;
        PaymentStatus status = a.getPaymentStatus();

        BigDecimal newPaid;
        BigDecimal newRemaining;
        PaymentStatus newStatus = status;

        // V2.2A.3: AppointmentStatus (randevu durumu — CANCELLED/NO_SHOW) her zaman
        // PaymentStatus'tan bağımsız olarak önceliklidir. Randevu gerçekleşmediyse
        // (iptal edildi ya da danışan gelmedi), ödeme durumu ne olursa olsun
        // paidAmount/remainingAmount 0'a zorlanır — eski/tutarsız seed verisi dahil.
        if (a.getStatus() == AppointmentStatus.CANCELLED || a.getStatus() == AppointmentStatus.NO_SHOW) {
            boolean changedNonBillable = !amountsEqual(a.getPaidAmount(), BigDecimal.ZERO)
                    || !amountsEqual(a.getRemainingAmount(), BigDecimal.ZERO);
            a.setPaidAmount(BigDecimal.ZERO);
            a.setRemainingAmount(BigDecimal.ZERO);
            return changedNonBillable;
        }

        if (fee.compareTo(BigDecimal.ZERO) <= 0) {
            // Ücret 0 ise ödenen/kalan de 0 olmalı — tutarsızlık olamaz.
            newPaid = BigDecimal.ZERO;
            newRemaining = BigDecimal.ZERO;
        } else {
            switch (status) {
                case PAID -> {
                    newPaid = fee;
                    newRemaining = BigDecimal.ZERO;
                }
                case UNPAID, PAY_LATER -> {
                    newPaid = BigDecimal.ZERO;
                    newRemaining = fee;
                }
                case FREE, PACKAGE_USED -> {
                    newPaid = BigDecimal.ZERO;
                    newRemaining = BigDecimal.ZERO;
                }
                case CANCELLED -> {
                    newPaid = clamp(paid, fee);
                    newRemaining = BigDecimal.ZERO;
                }
                case PARTIAL_PAID -> {
                    if (paid.compareTo(BigDecimal.ZERO) <= 0) {
                        // Hiç ödeme yoksa kısmi ödendi olamaz — ödenmedi'ye çekilir.
                        newStatus = PaymentStatus.UNPAID;
                        newPaid = BigDecimal.ZERO;
                        newRemaining = fee;
                    } else if (paid.compareTo(fee) >= 0) {
                        // Ödenen >= ücretse zaten tam ödenmiş demektir.
                        newStatus = PaymentStatus.PAID;
                        newPaid = fee;
                        newRemaining = BigDecimal.ZERO;
                    } else {
                        newPaid = paid;
                        newRemaining = fee.subtract(paid);
                    }
                }
                default -> { // NO_SHOW ve tanımsız durumlar
                    newPaid = clamp(paid, fee);
                    newRemaining = fee.subtract(newPaid).max(BigDecimal.ZERO);
                }
            }
        }

        boolea