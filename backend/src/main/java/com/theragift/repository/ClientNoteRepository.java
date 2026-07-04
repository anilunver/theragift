package com.theragift.repository;

import com.theragift.entity.Client;
import com.theragift.entity.ClientNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientNoteRepository extends JpaRepository<ClientNote, Long> {
    List<ClientNote> findByClientOrderByPinnedDescCreatedAtDesc(Client client);

    Optional<ClientNote> findByIdAndClient(Long id, Client client);
}
