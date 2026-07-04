package com.theragift.repository;

import com.theragift.entity.User;
import com.theragift.entity.WorkingHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface WorkingHourRepository extends JpaRepository<WorkingHour, Long> {
    List<WorkingHour> findByPsychologistOrderByDayOfWeekAsc(User psychologist);
    List<WorkingHour> findByPsychologistAndActiveTrue(User psychologist);
    Optional<WorkingHour> findByIdAndPsychologist(Long id, User psychologist);
    List<WorkingHour> findByPsychologistAndDayOfWeekAndActiveTrue(User psychologist, DayOfWeek dayOfWeek);
}
