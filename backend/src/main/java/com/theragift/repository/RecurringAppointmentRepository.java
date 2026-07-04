package com.theragift.repository;

import com.theragift.entity.Client;
import com.theragift.entity.RecurringAppointment;
import com.theragift.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecurringAppointmentRepository extends JpaRepository<RecurringAppointment, Long> {
    List<RecurringAppointment> findByPsychologistOrderByCreatedAtDesc(User psychologist);

    List<RecurringAppointment> findByClientAndPsychologistOrderByCreatedAtDesc(Client client, User psychologist);

    Optional<RecurringAppointment> findByIdAndPsychologist(Long id, User psychologist);
}
