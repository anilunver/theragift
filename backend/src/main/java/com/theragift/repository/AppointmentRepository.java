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

    List<Appointm