package com.theragift.controller;

import com.theragift.dto.unavailable.UnavailableBlockRequest;
import com.theragift.dto.unavailable.UnavailableBlockResponse;
import com.theragift.service.UnavailableBlockService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/unavailable-blocks")
@RequiredArgsConstructor
public class UnavailableBlockController {

    private final UnavailableBlockService unavailableBlockService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public List<UnavailableBlockResponse> list() {
        return unavailableBlockService.list(currentUserProvider.getCurrentUser());
    }

    @GetMapping("/range")
    public List<UnavailableBlockResponse> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return unavailableBlockService.range(currentUserProvider.getCurrentUser(), startDate, endDate);
    }

    @PostMapping
    public UnavailableBlockResponse create(@RequestBody UnavailableBlockRequest request) {
        return unavailableBlockService.create(currentUserProvider.getCurrentUser(), request);
    }

    @PutMapping("/{id}")
    public UnavailableBlockResponse update(@PathVariable Long id, @RequestBody UnavailableBlockRequest request) {
        return unavailableBlockService.update(currentUserProvider.getCurrentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        unavailableBlockService.delete(currentUserProvider.getCurrentUser(), id);
    }
}
