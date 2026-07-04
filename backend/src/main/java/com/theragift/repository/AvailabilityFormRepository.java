package com.theragift.repository;

import com.theragift.entity.AvailabilityForm;
import com.theragift.entity.User;
import com.theragift.enums.AvailabilityFormStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AvailabilityFormRepository extends JpaRepository<AvailabilityForm, Long> {
    Optional<AvailabilityForm> findByToken(String token);
    List<AvailabilityForm> findByPsychologistAndStatusOrderByCreatedAtDesc(User psychologist, AvailabilityFormStatus status);
    List<AvailabilityForm> findByPsychologistOrderByCreatedAtDesc(User psychologist);
}
