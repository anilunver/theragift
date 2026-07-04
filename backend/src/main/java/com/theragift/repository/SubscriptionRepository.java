package com.theragift.repository;

import com.theragift.entity.Subscription;
import com.theragift.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByPsychologist(User psychologist);
}
