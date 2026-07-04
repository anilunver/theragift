package com.theragift.repository;

import com.theragift.entity.Appointment;
import com.theragift.entity.Client;
import com.theragift.entity.RecurringAppointment;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPsychologistOrderByAppointmentDateDescStartTimeDesc(User psychologist);

    Optional<Appointment> findByIdAndPsychologist(Long id, User psychologist);

    List<Appointment> findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(
            User psychologist, LocalDate start, LocalDate end);

    List<Appointment> findByPsychologistAndAppointmentDate(User psychologist, LocalDate date);

    List<Appointment> findByClient(Client client);

    List<Appointment> findByPsychologistAndPaymentStatusIn(User psychologist, List<PaymentStatus> statuses);

    List<Appointment> findByPsychologistAndPaymentDueDateBeforeAndPaymentStatusIn(
            User psychologist, LocalDate date, List<PaymentStatus> statuses);

    List<Appointment> findByPsychologistAndAppointmentDateGreaterThanEqual(User psychologist, LocalDate date);

    // V2.2A.2: Payments sayfasında "İptal Edilenler" / "Gelmeyenler" sekmeleri için.
    // Not: bu AppointmentStatus'a göre filtreler (PaymentStatus'taki aynı isimli
    // CANCELLED/NO_SHOW değerleriyle KARIŞTIRILMAMALI — ikisi bağımsız alanlardır).
    List<Appointment> findByPsychologistAndStatus(User psychologist, AppointmentStatus status);

    // V2.2A.2: Bir sabit randevu kuralı pasifleştirildiğinde, sadece o kurala bağlı
    // GELECEKTEKİ ve hâlâ SCHEDULED olan randevuları bulmak için (toplu iptal).
    List<Appointment> findByRecurringAppointmentAndStatusAndAppointmentDateGreaterThanEqual(
            RecurringAppointment recurringAppointment, AppointmentStatus status, LocalDate date);

    // V2.2D.1: Bir danışan pasif yapılırken, sadece GELECEKTEKİ ve hâlâ SCHEDULED
    // olan randevularını bulmak için (geçmiş/COMPLETED/NO_SHOW/CANCELLED asla dahil değil).
    List<Appointment> findByClientAndStatusAndAppointmentDateGreaterThanEqual(
            Client client, AppointmentStatus status, LocalDate date);
}
