package com.theragift.util;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Danışanın serbest metin uygunluk notundan ("Pazartesi ve Çarşamba öğleden sonra
 * 10:00-14:00 uygun" gibi) gün ve saat aralığı bilgisini çıkarmaya çalışan basit
 * ortak yardımcı sınıf.
 *
 * Hem SuggestionService (öneri algoritması) hem AppointmentService (uygunluk dışı
 * uyarısı) tarafından kullanılır — tek yerden yönetildiği için iki modül arasında
 * tutarsızlık oluşmaz.
 */
public final class AvailabilityTextParser {

    private AvailabilityTextParser() {
    }

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

    // "10:00-14:00" veya "10:00 - 14:00" gibi saat aralıklarını yakalar
    private static final Pattern TIME_RANGE_PATTERN =
            Pattern.compile("(\\d{1,2}):(\\d{2})\\s*-\\s*(\\d{1,2}):(\\d{2})");

    // "10 ile 11 arası", "10 ile 11 arasında" gibi ifadeleri yakalar
    private static final Pattern RANGE_ARASI_PATTERN =
            Pattern.compile("(\\d{1,2})(?::(\\d{2}))?\\s*ile\\s*(\\d{1,2})(?::(\\d{2}))?\\s*aras");

    // "09:00 civarı", "sabah 9 civarı", "saat 9 sularında" gibi tek saat ifadelerini yakalar
    private static final Pattern APPROX_TIME_PATTERN =
            Pattern.compile("(\\d{1,2})(?::(\\d{2}))?\\s*(civar|sular)");

    public static List<DayOfWeek> extractPreferredDays(String text) {
        List<DayOfWeek> result = new ArrayList<>();
        if (text == null || text.isBlank()) return result;

        String normalized = text.toLowerCase(new Locale("tr", "TR"));
        for (Map.Entry<String, DayOfWeek> entry : TR_DAY_MAP.entrySet()) {
            if (normalized.contains(entry.getKey()) && !result.contains(entry.getValue())) {
                result.add(entry.getValue());
            }
        }
        return result;
    }

    /**
     * Metinden bir saat aralığı çıkarmaya çalışır. Sırasıyla:
     * "10:00-14:00", "10 ile 11 arası", "09:00 civarı" kalıplarını dener.
     * Hiçbiri bulunamazsa null döner (bu durumda saat filtresi uygulanmaz).
     */
    public static TimeRange extractPreferredTimeRange(String text) {
        if (text == null || text.isBlank()) return null;

        Matcher rangeMatcher = TIME_RANGE_PATTERN.matcher(text);
        if (rangeMatcher.find()) {
            TimeRange range = toRange(rangeMatcher.group(1), rangeMatcher.group(2), rangeMatcher.group(3), rangeMatcher.group(4));
            if (range != null) return range;
        }

        Matcher arasiMatcher = RANGE_ARASI_PATTERN.matcher(text);
        if (arasiMatcher.find()) {
            String startMin = arasiMatcher.group(2) != null ? arasiMatcher.group(2) : "00";
            String endMin = arasiMatcher.group(4) != null ? arasiMatcher.group(4) : "00";
            TimeRange range = toRange(arasiMatcher.group(1), startMin, arasiMatcher.group(3), endMin);
            if (range != null) return range;
        }

        Matcher approxMatcher = APPROX_TIME_PATTERN.matcher(text);
        if (approxMatcher.find()) {
            try {
                int hour = Integer.parseInt(approxMatcher.group(1));
                int minute = approxMatcher.group(2) != null ? Integer.parseInt(approxMatcher.group(2)) : 0;
                LocalTime center = LocalTime.of(hour, minute);
                // "civarı/sularında" ifadesi için makul bir tolerans penceresi (±30/+60 dk)
                LocalTime start = center.isBefore(LocalTime.of(0, 30)) ? LocalTime.MIDNIGHT : center.minusMinutes(30);
                LocalTime end = center.plusHours(1).isBefore(center) ? LocalTime.of(23, 59) : center.plusMinutes(60);
                return new TimeRange(start, end);
            } catch (Exception e) {
                return null;
            }
        }

        return null;
    }

    private static TimeRange toRange(String startHour, String startMin, String endHour, String endMin) {
        try {
            LocalTime start = LocalTime.of(Integer.parseInt(startHour), Integer.parseInt(startMin));
            LocalTime end = LocalTime.of(Integer.parseInt(endHour), Integer.parseInt(endMin));
            if (!start.isBefore(end)) return null;
            return new TimeRange(start, end);
        } catch (Exception e) {
            return null;
        }
    }

    public static String dayOfWeekToTurkish(DayOfWeek dow) {
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

    public record TimeRange(LocalTime start, LocalTime end) {
        public boolean contains(LocalTime slotStart, LocalTime slotEnd) {
            return !slotStart.isBefore(start) && !slotEnd.isAfter(end);
        }

        public boolean overlaps(LocalTime slotStart, LocalTime slotEnd) {
            return slotStart.isBefore(end) && slotEnd.isAfter(start);
        }
    }
}
