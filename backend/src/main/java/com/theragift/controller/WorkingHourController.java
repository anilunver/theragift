package com.theragift.controller;

import com.theragift.dto.workinghour.WorkingHourRequest;
import com.theragift.dto.workinghour.WorkingHourResponse;
import com.theragift.entity.User;
import com.theragift.service.WorkingHourService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/working-hours")
@RequiredArgsConstructor
public class WorkingHourController {

    private final WorkingHourService workingHourService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<WorkingHourResponse> getAll() {
        return workingHourService.getAll(currentUserProvider.getCurrentUser());
    }

    @PostMapping
    public WorkingHourResponse create(@RequestBody WorkingHourRequest request) {
        return workingHourService.create(currentUserProvider.getCurrentUser(), request);
    }

    @PutMapping("/{id}")
    public WorkingHourResponse update(@PathVariable Long id, @RequestBody WorkingHourRequest request) {
        return workingHourService.update(currentUserProvider.getCurrentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        workingHourService.delete(currentUserProvider.getCurrentUser(), id);
    }
}
