package com.theragift.repository;

import com.theragift.entity.UnavailableBlock;
import com.theragift.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UnavailableBlockRepository extends JpaRepository<UnavailableBlock, Long> {

    List<UnavailableBlock> findByPsychologistOrderByStartDateAsc(User psychologist);

    Optional<UnavailableBlock> findByIdAndPsychologist(Long id, User psychologist);

    // Bir tarih aralığıyla (range) KESİŞEN tüm bloklar: block.startDate <= rangeEnd
    // VE block.endDate >= rangeStart. Takvim görünümü ve "aralıkta blok var mı?"
    // kontrolleri için kullanılır.
    List<UnavailableBlock> findByPsychologistAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User psychologist, LocalDate rangeEnd, LocalDate rangeStart);
}
