package com.theragift.service;

import com.theragift.dto.suggestion.SuggestionResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.Client;
import com.theragift.entity.User;
import com.theragift.entity.WorkingHour;
import com.theragift.enums.AppointmentStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.ClientRepository;
import com.theragift.repository.WorkingHourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Basit ama çalışan randevu öneri algoritması.
 * Adımlar:
 * 1. Psikoloğun çalışma saatlerini oku
 * 2. Önümüzdeki 14 gün için her gün çalışma saatlerinden boş slotlar üret
 * 3. Mevcut randevularla çakışan / mola saatlerine denk gelen slotları ele
 * 4. Danışanın uygunluk notunu dikkate alarak skor hesapla
 * 5. En yüksek skorlu 3 slotu döndür
 */
@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final WorkingHourRepository workingHourRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;

    private static final int SLOT_MINUTES = 50;
    private static final int LOOKAHEAD_DAYS = 14;

    private static final Map<String, DayOfWeek> TR_DAY_MAP = Map.ofEntries(
            Map.entry("pazartesi", DayOfWeek.MONDAY),
            Map.entry("salı", DayOfWeek.TUESDAY),
            Map.entry("sali", DayOfWeek.TUESDAY),
            Map.entry("çarşamba", DayOfWeek.WEDNESDAY),
            Map.entry("carsamba", DayOfWeek.WEDNESDAY),
            Map.entry("perşembe", DayOfWeek.THURSDAY),
            Map.entry("persembe", DayOfWeek.THURSDAY),
            Map.entry("cuma", DayOfWeek.FRIDAY),
            Map.entry("cumartesi", DayOfWeek.SATURDAY),
            Map.entry("pazar", DayOfWeek.SUNDAY)
    );

    public List<SuggestionResponse> suggestForClient(User psychologist, Long clientId) {
        Client client = clientRepository.findByIdAndPsychologist(clientId, psychologist)
                .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));

        List<WorkingHour> workingHours = workingHourRepository.findByPsychologistAndActiveTrue(psychologist);
        if (workingHours.isEmpty()) {
            return List.of();
        }

        List<DayOfWeek> preferredDays = extractPreferredDays(client.getAvailabilityNotes());

        List<SuggestionResponse> candidates = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset++) {
            LocalDate date = today.plusDays(dayOffset);
            DayOfWeek dow = date.getDayOfWeek();

            List<WorkingHour> dayHours = workingHours.stream()
                    .filter(wh -> wh.getDayOfWeek() == dow)
                    .toList();

            for (WorkingHour wh : dayHours) {
                List<Appointment> existing = appointmentRepository.findByPsychologistAndAppointmentDate(psychologist, date)
                        .stream().filter(a -> a.getStatus() != AppointmentStatus.CANCELLED).toList();

                LocalTime cursor = wh.getStartTime();
                while (!cursor.plusMinutes(SLOT_MINUTES).isAfter(wh.getEndTime())) {
                    LocalTime slotStart = cursor;
                    LocalTime slotEnd = cursor.plusMinutes(SLOT_MINUTES);

                    boolean inBreak = wh.getBreakStartTime() != null && wh.getBreakEndTime() != null
                            && slotStart.isBefore(wh.getBreakEndTime()) && slotEnd.isAfter(wh.getBreakStartTime());

                    boolean conflicts = existing.stream().anyMatch(a ->
                            slotStart.isBefore(a.getEndTime()) && slotEnd.isAfter(a.getStartTime()));

                    boolean isPast = date.isEqual(today) && slotStart.isBefore(LocalTime.now());

                    if (!inBreak && !conflicts && !isPast) {
                        int score = computeScore(date, slotStart, dow, preferredDays, dayOffset);
                        String reason = buildReason(dow, slotStart, preferredDays.contains(dow), dayOffset);
                        candidates.add(SuggestionResponse.builder()
                                .date(date)
                                .startTime(slotStart)
                                .endTime(slotEnd)
                                .score(score)
                                .reason(reason)
                                .build());
                    }
                    cursor = cursor.plusMinutes(SLOT_MINUTES);
                }
            }
        }

        return candidates.stream()
                .sorted(Comparator.comparingInt(SuggestionResponse::getScore).reversed()
                        .thenComparing(SuggestionResponse::getDate)
                        .thenComparing(SuggestionResponse::getStartTime))
                .limit(3)
                .toList();
    }

    private int computeScore(LocalDate date, LocalTime start, DayOfWeek dow, List<DayOfWeek> preferredDays, int dayOffset) {
        int score = 70;

        // Danışanın tercih ettiği güne denk geliyorsa büyük bonus
        if (!preferredDays.isEmpty() && preferredDays.contains(dow)) {
            score += 20;
        }

        // Yakın tarihli slotlar biraz daha yüksek puan alır
        if (dayOffset <= 2) score += 8;
        else if (dayOffset <= 7) score += 4;

        // Sabah/öğleden sonra dengeli saatler (10:00-16:00) hafif bonus
        if (!start.isBefore(LocalTime.of(10, 0)) && !start.isAfter(LocalTime.of(16, 0))) {
            score += 4;
        }

        return Math.min(score, 98);
    }

    private String buildReason(DayOfWeek dow, LocalTime start, boolean matchesPreference, int dayOffset) {
        String dayNameTr = dayOfWeekToTurkish(dow);
        StringBuilder sb = new StringBuilder();
        sb.append(dayNameTr).append(" günü saat ").append(start).append(" için uygun boş slot.");
        if (matchesPreference) {
            sb.append(" Danışanın belirttiği uygunluk günüyle örtüşüyor.");
        }
        if (dayOffset <= 2) {
            sb.append(" Yakın tarihli olduğu için önceliklendirildi.");
        }
        return sb.toString();
    }

    private List<DayOfWeek> extractPreferredDays(String availabilityNotes) {
        List<DayOfWeek> result = new ArrayList<>();
        if (availabilityNotes == null || availabilityNotes.isBlank()) return result;

        String normalized = availabilityNotes.toLowerCase(new Locale("tr", "TR"));
        for (Map.Entry<String, DayOfWeek> entry : TR_DAY_MAP.entrySet()) {
            if (normalized.contains(entry.getKey()) && !result.contains(entry.getValue())) {
                result.add(entry.getValue());
            }
        }
        return result;
    }

    private String dayOfWeekToTurkish(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Pazartesi";
            case TUESDAY -> "Salı";
            case WEDNESDAY -> "Çarşamba";
            case THURSDAY -> "Perşembe";
            case FRIDAY -> "Cuma";
            case SATURDAY -> "Cumartesi";
            case SUNDAY -> "Pazar";
        };
    }
}
