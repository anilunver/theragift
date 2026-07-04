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
 * 2. Bugünden itibaren önümüzdeki {@value #LOOKAHEAD_DAYS} gün için, çalışma
 *    saatlerinden TAM SAATE HİZALANMIŞ (09:00, 10:00, 11:00 ...) ve minimum
 *    {@value #SLOT_MINUTES} dakikalık boş slotlar üret. (V2.2A.1: eskiden 50
 *    dakikalık, çalışma saati başlangıcından itibaren art arda ilerleyen
 *    slotlar üretiliyordu — bu, "09:50-10:40" gibi operasyonel olarak
 *    kullanışsız saatler doğuruyordu. Artık her slot her zaman :00'da başlar.)
 * 3. Mola saatine denk gelen slotları tamamen ele — asla önerilmez.
 * 4. Mevcut (İPTAL EDİLMEMİŞ) randevularla çakışan slotları ele — asla önerilmez.
 *    CANCELLED randevular çakışma sayılmaz, slotu boşaltır.
 * 5. Danışanın uygunluk notundan çıkarılan gün/saat tercihiyle uyuşmayan slotlar
 *    varsayılan olarak önerilmez (danışan hiç tercih belirtmediyse bu adım atlanır).
 * 6. Kalan adaylar tarihe göre (EN ERKEN önce) sıralanır ve ilk 3'ü döndürülür.
 *    Skor ve açıklama metni SADECE bu seçilen 3 slot için, sıralama belli
 *    olduktan SONRA hesaplanır — böylece "ilk uygun boş slot" ifadesi yalnızca
 *    gerçekten en erken olan slot için kullanılır.
 */
@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final WorkingHourRepository workingHourRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final UnavailableBlockService unavailableBlockService;

    // V2.2A.1: 50 -> 60. Öneriler artık her zaman tam saatlik bloklar halinde
    // ve saat başlarında (09:00, 10:00, ...) başlar.
    private static final int SLOT_MINUTES = 60;
    private static final int LOOKAHEAD_DAYS = 21;

    private record Candidate(
            LocalDate date,
            LocalTime start,
            LocalTime end,
            int dayOffset,
            int dayLoad,
            boolean matchesDayPreference,
            boolean matchesTimePreference,
            boolean freedByCancellation
    ) {}

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

        List<Candidate> rawCandidates = new ArrayList<>();

        // Bugünden başlayarak gün gün ilerler; ilk uygun günler öncelikli olarak
        // aday listesine eklenir (aşağıdaki sıralama zaten tarihe göre olduğu
        // için, en erken haftadaki boş slot her zaman sonraki haftalardakinden
        // önce gelecektir — aynı hafta içinde uygun slot varken sonraki haftaya
        // asla atlanmaz).
        for (int dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset++) {
            LocalDate date = today.plusDays(dayOffset);
            DayOfWeek dow = date.getDayOfWeek();

            // Danışan belirli gün(ler) belirtmişse, uymayan günler öneri listesine hiç girmesin.
            boolean matchesDayPreference = !preferredDays.isEmpty() && preferredDays.contains(dow);
            if (!preferredDays.isEmpty() && !matchesDayPreference) {
                continue;
            }

            List<WorkingHour> dayHours = workingHours.stream()
                    .filter(wh -> wh.getDayOfWeek() == dow)
                    .toList();
            if (dayHours.isEmpty()) {
                continue; // Psikolog o gün çalışmıyor
            }

            // V2.2B: Tam gün çalışma dışı / tatil olarak işaretlenmiş günler hiç
            // aday üretmez — bir sonraki uygun güne/haftaya otomatik geçilir.
            if (unavailableBlockService.isDateFullyBlocked(psychologist, date)) {
                continue;
            }

            List<Appointment> allThatDay = appointmentRepository.findByPsychologistAndAppointmentDate(psychologist, date);
            // Sadece İPTAL EDİLMEMİŞ randevular çakışma sayılır. CANCELLED olanlar
            // slotu boşaltır ve tekrar önerilebilir hale getirir.
            List<Appointment> active = allThatDay.stream()
                    .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                    .toList();
            List<Appointment> cancelled = allThatDay.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                    .toList();

            for (WorkingHour wh : dayHours) {
                // Slot üretimine HER ZAMAN tam saatten başlanır. Çalışma saati
                // başlangıcı zaten tam saatte değilse (örn. 09:15), bir sonraki
                // tam saate yuvarlanır (örn. 10:00) — böylece 09:50 gibi çeyrek
                // saatlerde başlayan öneriler asla üretilmez.
                LocalTime cursor = wh.getStartTime().getMinute() == 0
                        ? wh.getStartTime()
                        : wh.getStartTime().plusMinutes(60 - wh.getStartTime().getMinute());

                while (!cursor.plusMinutes(SLOT_MINUTES).isAfter(wh.getEndTime())) {
                    LocalTime slotStart = cursor;
                    LocalTime slotEnd = cursor.plusMinutes(SLOT_MINUTES);

                    boolean inBreak = wh.getBreakStartTime() != null && wh.getBreakEndTime() != null
                            && slotStart.isBefore(wh.getBreakEndTime()) && slotEnd.isAfter(wh.getBreakStartTime());

                    boolean conflicts = active.stream().anyMatch(a ->
                            slotStart.isBefore(a.getEndTime()) && slotEnd.isAfter(a.getStartTime()));

                    boolean isPast = date.isEqual(today) && slotStart.isBefore(LocalTime.now());

                    // Danışan belirli bir saat aralığı belirtmişse, bu aralığın dışındaki
                    // slotlar öneri listesine hiç girmesin.
                    boolean matchesTimePreference = preferredRange != null && preferredRange.contains(slotStart, slotEnd);
                    boolean outsidePreferredRange = preferredRange != null && !matchesTimePreference;

                    // V2.2B: kısmi saat kapalı bloğuna denk gelen slotlar önerilmez
                    // (tam gün blok zaten yukarıda elendi, burada kısmi saat kontrolü yapılır).
                    boolean unavailableBlocked = unavailableBlockService.isTimeRangeBlocked(psychologist, date, slotStart, slotEnd);

                    if (!inBreak && !conflicts && !isPast && !outsidePreferredRange && !unavailableBlocked) {
                        boolean freedByCancellation = cancelled.stream().anyMatch(a ->
                                slotStart.isBefore(a.getEndTime()) && slotEnd.isAfte