package com.theragift.config;

import com.theragift.entity.Appointment;
import com.theragift.repository.AppointmentRepository;
import com.theragift.util.PaymentNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Uygulama her açıldığında mevcut randevu kayıtlarındaki ödeme alanlarını
 * (paidAmount/remainingAmount) paymentStatus ile tutarlı hale getirir.
 * Örn: durum PAID ama paidAmount 0 gibi eski/bozuk kayıtları düzeltir.
 * SeedDataRunner'dan SONRA çalışır (Order=2), böylece taze seed edilen veri de
 * dahil her şey kontrolden geçer.
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class PaymentNormalizationRunner implements CommandLineRunner {

    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Appointment> all = appointmentRepository.findAll();
        List<Appointment> changed = new ArrayList<>();
        for (Appointment a : all) {
            if (PaymentNormalizer.normalize(a)) {
                changed.add(a);
            }
        }
        if (!changed.isEmpty()) {
            appointmentRepository.saveAll(changed);
        }
    }
}
