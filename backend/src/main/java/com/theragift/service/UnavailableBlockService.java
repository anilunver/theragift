package com.theragift.service;

import com.theragift.dto.unavailable.AffectedAppointmentSummary;
import com.theragift.dto.unavailable.UnavailableBlockRequest;
import com.theragift.dto.unavailable.UnavailableBlockResponse;
import com.theragift.entity.Appointment;
import com.theragift.entity.UnavailableBlock;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.UnavailableBlockType;
import com.theragift.exception.ApiException;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.UnavailableBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * V2.2B: Psikoloğun haftalık çalışma saatlerine ek olarak tanımladığı
 * "çalışma dışı gün / tatil / özel iş" bloklarını yönetir.
 * <p>
 * ÖNEMLİ İŞ KURALLARI:
 * - Bu bloklar iptal edilmiş randevu DEĞİLDİR; mevcut randevuları hiçbir
 *   şekilde otomatik iptal etmez veya değiştirmez.
 * - Randevu oluşturma / güncelleme sırasında SERT engel (blocker) değildir —
 *   sadece AppointmentService.computeWarnings() üzerinden "yumuşak uyarı"
 *   üretir (bkz. findBlockingMessage). Psikolog override ile yine de randevu
 *   oluşturabilir (örn. tatildeyken online bir seans almak isteyebilir).
 * - Bir blok eklenirken/güncellenirken o aralıkta aktif (CANCELLED olmayan)
 *   randevu varsa bu SADECE bilgi amaçlı raporlanır (affectedAppointmentsCount),
 *   hiçbir randevu otomatik silinmez/iptal edilmez.
 */
@Service
@RequiredArgsConstructor
public class UnavailableBlockService {

    private final UnavailableBlockRepository unavailableBlockRepository;
    private final AppointmentRepository appointmentRepository;

    public List<UnavailableBlockResponse> list(User psychologist) {
        return unavailableBlockRepository.findByPsychologistOrderByStartDateAsc(psychologist)
                .stream().map(b -> toResponseWithAffected(psychologist, b)).toList();
    }

    /**
     * V2.2C: Takvim gün kartlarının "Bu blokta planlı randevu var" uyarısını
     * ekstra istek atmadan gösterebilmesi için range() sonucu da etkilenen
     * randevu listesini içerir.
     */
    public List<UnavailableBlockResponse> range(User psychologist, LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isAfter(end)) {
            throw new ApiException("Geçerli bir tarih aralığı belirtmelisiniz.", HttpStatus.BAD_REQUEST);
        }
        return unavailableBlockRepository
                .findByPsychologistAndStartDateLessThanEqualAndEndDateGreaterThanEqual(psychologist, end, start)
                .stream().map(b -> toResponseWithAffected(psychologist, b)).toList();
    }

    @Transactional
    public UnavailableBlockResponse create(User psychologist, UnavailableBlockRequest request) {
        UnavailableBlock block = UnavailableBlock.builder()
                .psychologist(psychologist)
                .build();
        applyRequest(block, request);
        unavailableBlockRepository.save(block);
        return toResponseWithAffected(psychologist, block);
    }

    @Transactional
    public UnavailableBlockResponse update(User psychologist, Long id, UnavailableBlockRequest request) {
        UnavailableBlock block = findBlock(psychologist, id);
        applyRequest(block, request);
        unavailableBlockRepository.save(block);
        return toResponseWithAffected(psychologist, block);
    }

    @Transactional
    public void delete(User psychologist, Long id) {
        UnavailableBlock block = findBlock(psychologist, id);
        unavailableBlockRepository.delete(block);
    }

    private void applyRequest(UnavailableBlock block, UnavailableBlockRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ApiException("Başlık / sebep zorunludur.", HttpStatus.BAD_REQUEST);
        }
        if (request.getType() == null) {
            throw new ApiException("Tür seçimi zorunludur.", HttpStatus.BAD_REQUEST);
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new ApiException("Başlangıç ve bitiş tarihi zorunludur.", HttpStatus.BAD_REQUEST);
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new ApiException("Başlangıç tarihi bitiş tarihinden sonra olamaz.", HttpStatus.BAD_REQUEST);
        }

        boolean fullDay = request.getFullDay() == null || request.getFullDay();
        LocalTime startTime = null;
        LocalTime endTime = null;
        if (!fullDay) {
            startTime = request.getStartTime();
            endTime = request.getEndTime();
            if (startTime == null || endTime == null) {
                throw new ApiException("Tam gün değilse başlangıç ve bitiş saati zorunludur.", HttpStatus.BAD_REQUEST);
            }
            if (!startTime.isBefore(endTime)) {
                throw new ApiException("Bitiş saati başlangıç saatinden sonra olmalıdır.", HttpStatus.BAD_REQUEST);
            }
        }

        block.setTitle(request.getTitle().trim());
        block.setType(request.getType());
        block.setStartDate(request.getStartDate());
        block.setEndDate(request.getEndDate());
        block.setFullDay(fullDay);
        block.setStartTime(startTime);
        block.setEndTime(endTime);
        block.setNote(request.getNote());
    }

    /**
     * V2.2B madde 13 / V2.2C: bloğun tarih (ve varsa saat) aralığına denk gelen,
     * henüz CANCELLED olmayan randevuların listesi. Sadece bilgi amaçlıdır —
     * hiçbir kayıt bu sayım/liste nedeniyle değiştirilmez/silinmez.
     */
    private List<Appointment> findAffectedAppointments(User psychologist, UnavailableBlock block) {
        List<Appointment> inRange = appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(
                        psychologist, block.getStartDate(), block.getEndDate());

        return inRange.stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .filter(a -> block.isFullDay() || overlapsBlockTime(block, a.getStartTime(), a.getEndTime()))
                .toList();
    }

    private boolean overlapsBlockTime(UnavailableBlock block, LocalTime start, LocalTime end) {
        if (block.getStartTime() == null || block.getEndTime() == null) return true;
        return start.isBefore(block.getEndTime()) && end.isAfter(block.getStartTime());
    }

    /**
     * AppointmentService.computeWarnings() tarafından çağrılır. Belirtilen
     * tarih/saat aralığı bir unavailable block'a denk geliyorsa uyarı mesajını
     * döner; denk gelmiyorsa boş (Optional.empty()) döner. SERT ENGEL DEĞİLDİR.
     */
    public Optional<String> findBlockingMessage(User psychologist, LocalDate date, LocalTime start, LocalTime end) {
        List<UnavailableBlock> blocks = unavailableBlockRepository
                .findByPsychologistAndStartDateLessThanEqualAndEndDateGreaterThanEqual(psychologist, date, date);

        for (UnavailableBlock b : blocks) {
            if (b.isFullDay()) {
                return Optional.of("Bu tarih (" + formatDate(date) + ") psikolog tarafından " + typeLabel(b.getType())
                        + " olarak işaretlenmiş. Yine de oluşturmak istiyor musunuz?");
            }
            if (overlapsBlockTime(b, start, end)) {
                return Optional.of("Bu saat aralığı psikolog tarafından " + typeLabel(b.getType())
                        + " olarak kapalı işaretlenmiş. Yine de oluşturmak istiyor musunuz?");
            }
        }
        return Optional.empty();
    }

    /**
     * SuggestionService tarafından kullanılır: belirtilen tarih tam gün kapalı mı?
     */
    public boolean isDateFullyBlocked(User psychologist, LocalDate date) {
        return unavailableBlockRepository
                .findByPsychologistAndStartDateLessThanEqualAndEndDateGreaterThanEqual(psychologist, date, date)
                .stream().anyMatch(UnavailableBlock::isFullDay);
    }

    /**
     * SuggestionService tarafından kullanılır: belirtilen tarih/saat aralığı
     * (tam gün ya da kısmi saat) herhangi bir blok ile çakışıyor mu?
     */
    public boolean isTimeRangeBlocked(User psychologist, LocalDate date, LocalTime start, LocalTime end) {
        List<UnavailableBlock> blocks = unavailableBlockRepository
                .findByPsychologistAndStartDateLessThanEqualAndEndDateGreaterThanEqual(psychologist, date, date);
        return blocks.stream().anyMatch(b -> b.isFullDay() || overlapsBlockTime(b, start, end));
    }

    private String typeLabel(UnavailableBlockType type) {
        return switch (type) {
            case VACATION -> "Tatil";
            case PERSONAL -> "Özel iş";
            case HOLIDAY -> "Resmi tatil";
            case DAY_OFF -> "Çalışma dışı";
            case CUSTOM -> "Çalışma dışı";
        };
    }

    private String formatDate(LocalDate date) {
        return "%02d.%02d.%04d".formatted(date.getDayOfMonth(), date.getMonthValue(), date.getYear());
    }

    private UnavailableBlock findBlock(User psychologist, Long id) {
        return unavailableBlockRepository.findByIdAndPsychologist(id, psychologist)
                .orElseThrow(() -> new ApiException("Çalışma dışı gün/tatil bloğu bulunamadı", HttpStatus.NOT_FOUND));
    }

    private UnavailableBlockResponse toResponseWithAffected(User psychologist, UnavailableBlock b) {
        List<Appointment> affected = findAffectedAppointments(psychologist, b);
        List<AffectedAppointmentSummary> summaries = affected.stream()
                .map(a -> AffectedAppointmentSummary.builder()
                        .appointmentId(a.getId())
                        .appointmentDate(a.getAppointmentDate())
                        .startTime(a.getStartTime())
                        .endTime(a.getEndTime())
                        .clientFullName(a.getClient().getFirstName() + " " + a.getClient().getLastName())
                        .status(a.getStatus().name())
                        .sessionType(a.getSessionType().name())
                        .build())
                .toList();

        return UnavailableBlockResponse.builder()
                .id(b.getId())
                .title(b.getTitle())
                .type(b.getType().name())
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .fullDay(b.isFullDay())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .note(b.getNote())
                .affectedAppointmentsCount(summaries.size())
                .affectedAppointments(summaries)
                .createdAt(b.getCreatedAt())
                .build();
    }
}
