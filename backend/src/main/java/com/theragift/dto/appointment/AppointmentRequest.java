package com.theragift.dto.appointment;

import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentMethod;
import com.theragift.enums.PaymentStatus;
import com.theragift.enums.SessionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentRequest {
    private Long clientId;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private SessionType sessionType;
    private AppointmentStatus status;
    private String notes;
    private BigDecimal sessionFee;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private LocalDate paymentDueDate;

    // true ise: mola/mesai dışı/danışan uygunluğu gibi "yumuşak" uyarılar göz ardı
    // edilip randevu yine de oluşturulur. Çakışma (conflict) kontrolü bundan etkilenmez,
    // o her zaman kesin engeldir.
    private Boolean overrideWarnings;

    public boolean isOverrideWarnings() {
        return Boolean.TRUE.equals(overrideWarnings);
    }
}
