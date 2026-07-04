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
     * Metinden ilk saat aralığını çıkarır. Bulunamazsa null döner.
     */
    public static TimeRange extractPreferredTimeRange(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher matcher = TIME_RANGE_PATTERN.matcher(text);
        if (!matcher.find()) return null;
        try {
            LocalTime start = LocalTime.of(Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2)));
            LocalTime end = LocalTime.of(Integer.parseInt(matcher.group(3)), Integer.parseInt(matcher.group(4)));
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
