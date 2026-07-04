package com.theragift.repository;

import com.theragift.entity.PsychologistProfile;
import com.theragift.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PsychologistProfileRepository extends JpaRepository<PsychologistProfile, Long> {
    Optional<PsychologistProfile> findByUser(User user);
    Optional<PsychologistProfile> findByUserId(Long userId);
}
