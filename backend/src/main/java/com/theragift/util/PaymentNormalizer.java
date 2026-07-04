package com.theragift.util;

import com.theragift.entity.Appointment;
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

        boolean changed = !amountsEqual(a.getPaidAmount(), newPaid)
                || !amountsEqual(a.getRemainingAmount(), newRemaining)
                || newStatus != status;

        a.setPaidAmount(newPaid);
        a.setRemainingAmount(newRemaining);
        a.setPaymentStatus(newStatus);
        return changed;
    }

    private static BigDecimal clamp(BigDecimal value, BigDecimal max) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value;
        if (v.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        if (v.compareTo(max) > 0) return max;
        return v;
    }

    private static boolean amountsEqual(BigDecimal a, BigDecimal b) {
        BigDecimal x = a == null ? BigDecimal.ZERO : a;
        BigDecimal y = b == null ? BigDecimal.ZERO : b;
        return x.compareTo(y) == 0;
    }
}
