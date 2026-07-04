package com.theragift.repository;

import com.theragift.entity.UsageQuota;
import com.theragift.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsageQuotaRepository extends JpaRepository<UsageQuota, Long> {
    Optional<UsageQuota> findByPsychologist(User psychologist);
}
