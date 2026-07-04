package com.theragift.controller;

import com.theragift.dto.suggestion.SuggestionResponse;
import com.theragift.service.SuggestionService;
import com.theragift.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/client/{clientId}")
    public List<SuggestionResponse> suggestForClient(@PathVariable Long clientId) {
        return suggestionService.suggestForClient(currentUserProvider.getCurrentUser(), clientId);
    }
}
