package com.theragift.service;

import com.theragift.dto.appointment.AppointmentRequest;
import com.theragift.dto.appointment.AppointmentResponse;
import com.theragift.dto.appointment.PaymentUpdateRequest;
import com.theragift.entity.Appointment;
import com.theragift.entity.AuditLog;
import com.theragift.entity.Client;
import com.theragift.entity.User;
import com.theragift.enums.AppointmentStatus;
import com.theragift.enums.PaymentStatus;
import com.theragift.exception.ApiException;
import com.theragift.repository.AppointmentRepository;
import com.theragift.repository.AuditLogRepository;
import com.theragift.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final AuditLogRepository auditLogRepository;

    public List<AppointmentResponse> getAll(User psychologist) {
        return appointmentRepository.findByPsychologistOrderByAppointmentDateDescStartTimeDesc(psychologist)
                .stream().map(this::toResponse).toList();
    }

    public AppointmentResponse getById(User psychologist, Long id) {
        return toResponse(findAppointment(psychologist, id));
    }

    public List<AppointmentResponse> getWeek(User psychologist, LocalDate weekStart) {
        LocalDate start = weekStart != null ? weekStart : LocalDate.now();
        LocalDate end = start.plusDays(6);
        return appointmentRepository
                .findByPsychologistAndAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(psychologist, start, end)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AppointmentResponse create(User psychologist, AppointmentRequest request) {
        Client client = clientRepository.findByIdAndPsychologist(request.getClientId(), psychologist)
                .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));

        checkConflict(psychologist, request.getAppointmentDate(), request.getStartTime(), request.getEndTime(), null);

        BigDecimal fee = request.getSessionFee() != null ? request.getSessionFee() : client.getDefaultSessionFee();

        Appointment appointment = Appointment.builder()
                .client(client)
                .psychologist(psychologist)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .sessionType(request.getSessionType())
                .status(request.getStatus() != null ? request.getStatus() : AppointmentStatus.SCHEDULED)
                .notes(request.getNotes())
                .sessionFee(fee)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.UNPAID)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : client.getDefaultPaymentMethod())
                .paymentDueDate(request.getPaymentDueDate())
                .remainingAmount(fee)
                .build();

        appointmentRepository.save(appointment);
        logAudit(psychologist, "APPOINTMENT_CREATED", "Appointment", appointment.getId());
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse update(User psychologist, Long id, AppointmentRequest request) {
        Appointment appointment = findAppointment(psychologist, id);

        LocalDate date = request.getAppointmentDate() != null ? request.getAppointmentDate() : appointment.getAppointmentDate();
        var start = request.getStartTime() != null ? request.getStartTime() : appointment.getStartTime();
        var end = request.getEndTime() != null ? request.getEndTime() : appointment.getEndTime();

        checkConflict(psychologist, date, start, end, appointment.getId());

        if (request.getClientId() != null) {
            Client client = clientRepository.findByIdAndPsychologist(request.getClientId(), psychologist)
                    .orElseThrow(() -> new ApiException("Danışan bulunamadı", HttpStatus.NOT_FOUND));
            appointment.setClient(client);
        }
        appointment.setAppointmentDate(date);
        appointment.setStartTime(start);
        appointment.setEndTime(end);
        if (request.getSessionType() != null) appointment.setSessionType(request.getSessionType());
        if (request.getStatus() != null) appointment.setStatus(request.getStatus());
        if (request.getNotes() != null) appointment.setNotes(request.getNotes());
        if (request.getSessionFee() != null) appointment.setSessionFee(request.getSessionFee());
        if (request.getPaymentStatus() != null) appointment.setPaymentStatus(request.getPaymentStatus());
        if (request.getPaymentMethod() != null) appointment.setPaymentMethod(request.getPaymentMethod());
        if (request.getPaymentDueDate() != null) appointment.setPaymentDueDate(request.getPaymentDueDate());

        appointmentRepository.save(appointment);
        logAudit(psychologist, "APPOINTMENT_UPDATED", "Appointment", appointment.getId());
        return toResponse(appointment);
    }

    @Transactional
    public void delete(User psychologist, Long id) {
        Appointment appointment = findAppointment(psychologist, id);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        logAudit(psychologist, "APPOINTMENT_CANCELLED", "Appointment", appointment.getId());
    }

    @Transactional
    public AppointmentResponse updatePayment(User psychologist, Long id, PaymentUpdateRequest request) {
        Appointment appointment = findAppointment(psychologist, id);

        if (request.getPaymentStatus() != null) appointment.setPaymentStatus(request.getPaymentStatus());
        if (request.getPaymentMethod() != null) appointment.setPaymentMethod(request.getPaymentMethod());
        if (request.getPaymentDate() != null) appointment.setPaymentDate(request.getPaymentDate());
        if (request.getPaymentDueDate() != null) appointment.setPaymentDueDate(request.getPaymentDueDate());
        if (request.getPaymentNote() != null) appointment.setPaymentNote(request.getPaymentNote());

        BigDecimal fee = appointment.getSessionFee() != null ? appointment.getSessionFee() : BigDecimal.ZERO;
        BigDecimal paid = request.getPaidAmount() != null ? request.getPaidAmount() : appointment.getPaidAmount();
        if (paid == null) paid = BigDecimal.ZERO;
        appointment.setPaidAmount(paid);
        appointment.setRemainingAmount(fee.subtract(paid).max(BigDecimal.ZERO));

        appointmentRepository.save(appointment);
        logAudit(psychologist, "PAYMENT_UPDATED", "Appointment", appointment.getId());
        return toResponse(appointment);
    }

    private void checkConflict(User psychologist, LocalDate date, java.time.LocalTime start, java.time.LocalTime end, Long excludeId) {
        List<Appointment> sameDay = appointmentRepository.findByPsychologistAndAppointmentDate(psychologist, date);
        for (Appointment a : sameDay) {
            if (excludeId != null && a.getId().equals(excludeId)) continue;
            if (a.getStatus() == AppointmentStatus.CANCELLED) continue;
            boolean overlap = start.isBefore(a.getEndTime()) && end.isAfter(a.getStartTime());
            if (overlap) {
                throw new ApiException("Bu saat aralığında zaten bir randevu var (" + a.getStartTime() + " - " + a.getEndTime() + ")", HttpStatus.CONFLICT);
            }
        }
    }

    private void logAudit(User user, String action, String entityType, Long entityId) {
        auditLogRepository.save(AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .build());
    }

    private Appointment findAppointment(User psychologist, Long id) {
        return appointmentRepository.findByIdAndPsychologist(id, psychologist)
                .orElseThrow(() -> new ApiException("Randevu bulunamadı", HttpStatus.NOT_FOUND));
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .clientId(a.getClient().getId())
                .clientFullName(a.getClient().getFirstName() + " " + a.getClient().getLastName())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .sessionType(a.getSessionType().name())
                .status(a.getStatus().name())
                .notes(a.getNotes())
                .sessionFee(a.getSessionFee())
                .paymentStatus(a.getPaymentStatus().name())
                .paymentMethod(a.getPaymentMethod() != null ? a.getPaymentMethod().name() : null)
                .paidAmount(a.getPaidAmount())
                .remainingAmount(a.getRemainingAmount())
                .paymentDate(a.getPaymentDate())
                .paymentDueDate(a.getPaymentDueDate())
                .paymentNote(a.getPaymentNote())
                .build();
    }
}
