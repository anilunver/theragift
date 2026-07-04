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

                    if (!inBreak && !conflicts && !isPast && !outsidePreferredRange) {
                        boolean freedByCancellation = cancelled.stream().anyMatch(a ->
                                slotStart.isBefore(a.getEndTime()) && slotEnd.isAfter(a.getStartTime()));

                        rawCandidates.add(new Candidate(date, slotStart, slotEnd, dayOffset, active.size(),
                                matchesDayPreference, matchesTimePreference, freedByCancellation));
                    }
                    cursor = cursor.plusMinutes(SLOT_MINUTES);
                }
            }
        }

        // En erken uygun slot her zaman önce gelir; dolu/mola/mesai dışı slotlar
        // yukarıdaki filtrelerde zaten elendiği için burada asla yer almaz.
        List<Candidate> selected = rawCandidates.stream()
                .sorted(Comparator.comparing(Candidate::date).thenComparing(Candidate::start))
                .limit(3)
                .toList();

        List<SuggestionResponse> result = new ArrayList<>();
        for (int i = 0; i < selected.size(); i++) {
            Candidate c = selected.get(i);
            boolean isEarliestOverall = i == 0;
            int score = computeScore(c);
            String reason = buildReason(c, isEarliestOverall);
            result.add(SuggestionResponse.builder()
                    .date(c.date())
                    .startTime(c.start())
                    .endTime(c.end())
                    .score(score)
                    .reason(reason)
                    .matchLabel(matchLabel(score, c.dayLoad()))
                    .build());
        }
        return result;
    }

    /**
     * V2.2A.2: Basit, açık kurallı MVP skor mantığı (kullanıcı tarafından
     * birebir bu şekilde talep edildi). Not: aktif çakışma / mola / mesai dışı
     * / danışan uygunluğu dışı slotlar zaten YUKARIDAKİ filtrelerde elenip
     * hiç Candidate'e dönüşmediği için bu üç büyük ceza (-100/-50/-50/-40)
     * pratikte hiç tetiklenmez — buraya yine de belgelendirme ve gelecekte
     * "override ile göster" gibi bir MVP sonrası ihtiyaç çıkarsa hazır olması
     * için not düşülmüştür.
     * <p>
     * Base: 50
     * +25 danışanın uygun günüyle eşleşiyorsa
     * +25 danışanın uygun saat aralığıyla eşleşiyorsa
     * +15 psikoloğun mesai saatleri içindeyse (buraya ulaşan her slot zaten içeride)
     * +10 gün düşük yoğunluklu ise (0-2 randevu)
     * +5 iptal edilen slot boşaldığı için uygunsa
     * -15 gün orta yoğunluklu ise (3-5 randevu)
     * -30 gün çok yoğun ise (6+ randevu)
     */
    private int computeScore(Candidate c) {
        int score = 50;

        if (c.matchesDayPreference()) score += 25;
        if (c.matchesTimePreference()) score += 25;
        score += 15; // filtrelerden geçen her slot zaten mesai saatleri içinde

        if (c.dayLoad() <= 2) score += 10;
        else if (c.dayLoad() <= 5) score -= 15;
        else score -= 30;

        if (c.freedByCancellation()) score += 5;

        return Math.max(0, Math.min(score, 100));
    }

    /** 0-2 randevu: Düşük yoğunluk, 3-5: Orta yoğunluk, 6+: Yoğun gün. */
    private String densityLabel(int dayLoad) {
        if (dayLoad <= 2) return "Düşük yoğunluk";
        if (dayLoad <= 5) return "Orta yoğunluk";
        return "Yoğun gün";
    }

    /** Kart üzerinde skorun yanında gösterilecek kısa etiket. */
    private String matchLabel(int score, int dayLoad) {
        if (dayLoad >= 6) return "Yoğun gün";
        if (score >= 90) return "En uygun";
        if (score >= 70) return "Uygun";
        return "Alternatif";
    }

    /**
     * Örnek çıktı: "Çarşamba günü 09:00 - 10:00 aralığı ilk uygun boş slot.
     * Danışanın uygun günüyle eşleşiyor. İptal edilen bir randevu sayesinde bu
     * slot boşaldı." — saat aralığı HER ZAMAN açıkça belirtilir, tek bir saat
     * ("09:50 için") asla yazılmaz.
     */
    private String buildReason(Candidate c, boolean isEarliestOverall) {
        List<String> reasons = new ArrayList<>();
        String dayNameTr = AvailabilityTextParser.dayOfWeekToTurkish(c.date().getDayOfWeek());
        String rangeStr = c.start() + " - " + c.end();

        String dayPhrase = c.dayOffset() == 0 ? "Bugün" : dayNameTr + " günü";
        String qualifier = isEarliestOverall ? "ilk uygun boş slot." : "uygun.";
        reasons.add(dayPhrase + " " + rangeStr + " aralığı " + qualifier);

        if (c.matchesDayPreference()) {
            reasons.add("Danışanın uygun günüyle eşleşiyor.");
        }
        if (c.matchesTimePreference()) {
            reasons.add("Danışanın belirttiği saat aralığıyla eşleşiyor.");
        }
        if (!c.matchesDayPreference() && !c.matchesTimePreference()) {
            reasons.add("Psikoloğun çalışma saatleri içinde.");
        }
        if (c.freedByCancellation()) {
            reasons.add("İptal edilen randevu sayesinde bu slot boşaldı.");
        }

        String density = densityLabel(c.dayLoad());
        if (density.equals("Düşük yoğunluk")) {
            reasons.add("Bu gün düşük yoğunluklu.");
        } else if (density.equals("Orta yoğunluk")) {
            reasons.add("Bu gün orta yoğunlukta.");
        } else {
            reasons.add("Bu gün yoğun; daha uygun alternatif varsa öncelik verilmedi.");
        }

        return String.join(" ", reasons);
    }
}
