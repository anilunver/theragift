package com.theragift.service;

import com.theragift.dto.workinghour.WorkingHourRequest;
import com.theragift.dto.workinghour.WorkingHourResponse;
import com.theragift.entity.User;
import com.theragift.entity.WorkingHour;
import com.theragift.exception.ApiException;
import com.theragift.repository.WorkingHourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkingHourService {

    private final WorkingHourRepository workingHourRepository;

    public List<WorkingHourResponse> getAll(User psychologist) {
        return workingHourRepository.findByPsychologistOrderByDayOfWeekAsc(psychologist)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public WorkingHourResponse create(User psychologist, WorkingHourRequest request) {
        WorkingHour wh = WorkingHour.builder()
                .psychologist(psychologist)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakStartTime(request.getBreakStartTime())
                .breakEndTime(request.getBreakEndTime())
                .active(request.getActive() == null || request.getActive())
                .build();
        workingHourRepository.save(wh);
        return toResponse(wh);
    }

    @Transactional
    public WorkingHourResponse update(User psychologist, Long id, WorkingHourRequest request) {
        WorkingHour wh = workingHourRepository.findByIdAndPsychologist(id, psychologist)
                .orElseThrow(() -> new ApiException("Çalışma saati bulunamadı", HttpStatus.NOT_FOUND));

        if (request.getDayOfWeek() != null) wh.setDayOfWeek(request.getDayOfWeek());
        if (request.getStartTime() != null) wh.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) wh.setEndTime(request.getEndTime());
        wh.setBreakStartTime(request.getBreakStartTime());
        wh.setBreakEndTime(request.getBreakEndTime());
        if (request.getActive() != null) wh.setActive(request.getActive());

        workingHourRepository.save(wh);
        return toResponse(wh);
    }

    @Transactional
    public void delete(User psychologist, Long id) {
        WorkingHour wh = workingHourRepository.findByIdAndPsychologist(id, psychologist)
                .orElseThrow(() -> new ApiException("Çalışma saati bulunamadı", HttpStatus.NOT_FOUND));
        workingHourRepository.delete(wh);
    }

    private WorkingHourResponse toResponse(WorkingHour wh) {
        return WorkingHourResponse.builder()
                .id(wh.getId())
                .dayOfWeek(wh.getDayOfWeek())
                .startTime(wh.getStartTime())
                .endTime(wh.getEndTime())
                .breakStartTime(wh.getBreakStartTime())
                .breakEndTime(wh.getBreakEndTime())
                .active(wh.isActive())
                .build();
    }
}
