package com.theragift.repository;

import com.theragift.entity.Client;
import com.theragift.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByPsychologistOrderByCreatedAtDesc(User psychologist);
    Optional<Client> findByIdAndPsychologist(Long id, User psychologist);
    long countByPsychologist(User psychologist);
}
