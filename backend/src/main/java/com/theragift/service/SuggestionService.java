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
import com.theragift.util.AvailabilityTextParser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Randevu öneri algoritması.
 * Adımlar (her biri sırayla uygulanır, hiçbiri atlanmaz):
 * 1. Psikoloğun aktif çalışma günlerini ve saatlerini oku.
 * 2. Önümüzdeki {@value #LOOKAHEAD_DAYS} gün için, çalışma saatlerinden seans
 *    süresi kadar boş slotlar üret.
 * 3. Mola saatine denk gelen slotları tamamen ele — asla önerilmez.
 * 4. Mevcut (iptal olmayan) randevularla çakışan slotları ele — asla önerilmez.
 * 5. Danışanın uygunluk notundan çıkarılan gün/saat tercihiyle uyuşmayan slotlar
 *    varsayılan olarak önerilmez (danışan hiç tercih belirtmediyse bu adım atlanır).
 * 6. Kalan adaylar; danışan tercihine uyum, yakın tarihli olma ve o günün genel
 *    yoğunluğuna göre skorlanır, en yüksek skorlu 3 slot döndürülür.
 * Bir gün tamamen doluysa/uygun değilse otomatik olarak bir sonraki uygun güne
 * geçilir (döngü zaten tüm günleri tarar).
 */
@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final WorkingHourRepository workingHourRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;

    private static final int SLOT_MINUTES = 50;
    private static final int LOOKAHEAD_DAYS = 14;

    public List<SuggestionResponse> suggestForClient(User psychologist, Long clientId) {
        Client client = clientRepository.findByIdAndPsychologist(clientId, psychologist)
                .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));

        List<WorkingHour> workingHours = workingHourRepository.findByPsychologistAndActiveTrue(psychologist);
        if (workingHours.isEmpty()) {
            return List.of();
        }

        List<DayOfWeek> preferredDays = AvailabilityTextParser.extractPreferredDays(client.getAvailabilityNotes());
        AvailabilityTextParser.TimeRange preferredRange = AvailabilityTextParser.extractPreferredTimeRange(client.getAvailabilityNotes());

        LocalDate today = LocalDate.now();

        List<SuggestionResponse> candidates = new ArrayList<>();

        for (int dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset++) {
            LocalDate date = today.plusDays(dayOffset);
            DayOfWeek dow = date.getDayOfWeek();

            // Danışan belirli gün(ler) belirtmişse, uymayan günler öneri listesine hiç girmesin.
            if (!preferredDays.isEmpty() && !preferredDays.contains(dow)) {
                continue;
            }

            List<WorkingHour> dayHours = workingHours.stream()
                    .filter(wh -> wh.getDayOfWeek() == dow)
                    .toList();
            if (dayHours.isEmpty()) {
                continue; // Psikolog o gün çalışmıyor
            }

            List<Appointment> existing = appointmentRepository.findByPsychologistAndAppointmentDate(psychologist, date)
                    .stream().filter(a -> a.getStatus() != AppointmentStatus.CANCELLED).toList();

            for (WorkingHour wh : dayHours) {
                LocalTime cursor = wh.getStartTime();
                while (!cursor.plusMinutes(SLOT_MINUTES).isAfter(wh.getEndTime())) {
                    LocalTime slotStart = cursor;
                    LocalTime slotEnd = cursor.plusMinutes(SLOT_MINUTES);

                    boolean inBreak = wh.getBreakStartTime() != null && wh.getBreakEndTime() != null
                            && slotStart.isBefore(wh.getBreakEndTime()) && slotEnd.isAfter(wh.getBreakStartTime());

                    boolean conflicts = existing.stream().anyMatch(a ->
                            slotStart.isBefore(a.getEndTime()) && slotEnd.isAfter(a.getStartTime()));

                    boolean isPast = date.isEqual(today) && slotStart.isBefore(LocalTime.now());

                    // Danışan belirli bir saat aralığı belirtmişse, bu aralığın dışındaki
                    // slotlar öneri listesine hiç girmesin.
                    boolean outsidePreferredRange = preferredRange != null && !preferredRange.contains(slotStart, slotEnd);

                    if (!inBreak && !conflicts && !isPast && !outsidePreferredRange) {
                        int score = computeScore(slotStart, dow, preferredDays, preferredRange != null, dayOffset, existing.size());
                        String reason = buildReason(dow, slotStart, !preferredDays.isEmpty(), preferredRange != null, dayOffset, existing.size());
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

    private int computeScore(LocalTime start, DayOfWeek dow, List<DayOfWeek> preferredDays,
                              boolean hasPreferredRange, int dayOffset, int dayLoad) {
        int score = 65;

        // Danışanın tercih ettiği güne denk geliyorsa büyük bonus (bu noktaya kadar
        // gelen adaylar zaten filtrelenmiş olduğu için preferredDays boş değilse eşleşme kesindir).
        if (!preferredDays.isEmpty()) {
            score += 15;
        }
        if (hasPreferredRange) {
            score += 10;
        }

        // Yakın tarihli slotlar biraz daha yüksek puan alır
        if (dayOffset <= 2) score += 6;
        else if (dayOffset <= 7) score += 3;

        // O gün ne kadar az randevu varsa o kadar "az yoğun" kabul edilir
        if (dayLoad == 0) score += 6;
        else if (dayLoad <= 2) score += 3;

        // Sabah/öğleden sonra dengeli saatler (10:00-16:00) hafif bonus
        if (!start.isBefore(LocalTime.of(10, 0)) && !start.isAfter(LocalTime.of(16, 0))) {
            score += 3;
        }

        return Math.min(score, 97);
    }

    private String buildReason(DayOfWeek dow, LocalTime start, boolean matchesDayPreference,
                                boolean matchesTimePreference, int dayOffset, int dayLoad) {
        List<String> reasons = new ArrayList<>();
        String dayNameTr = AvailabilityTextParser.dayOfWeekToTurkish(dow);

        reasons.add(dayNameTr + " günü saat " + start + " psikoloğun çalışma saatleri içinde.");
        if (matchesDayPreference) {
            reasons.add("Danışanın uygun günüyle eşleşiyor.");
        }
        if (matchesTimePreference) {
            reasons.add("Danışanın belirttiği saat aralığıyla uyumlu.");
        }
        if (dayLoad == 0) {
            reasons.add("Bu gün henüz hiç randevu yok, daha az yoğun.");
        } else if (dayLoad <= 2) {
            reasons.add("Bu gün daha az yoğun.");
        }
        if (dayOffset <= 2) {
            reasons.add("Yakın tarihli olduğu için önceliklendirildi.");
        }

        return String.join(" ", reasons);
    }
}
