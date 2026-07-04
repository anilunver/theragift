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
            TimeRange range = toRange(arasiMatcher.group(1), startMin, arasiMatcher.group(3), endMin