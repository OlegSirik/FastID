package ru.fastid.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.fastid.dto.SessionResponse;
import ru.fastid.service.BackendSessionService;

@RestController
@RequestMapping("/api/public")
public class SessionController {

    private final BackendSessionService sessionService;

    public SessionController(BackendSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/session")
    public ResponseEntity<SessionResponse> session() {
        SessionResponse response = sessionService.getSession();
        if (!response.isReady()) {
            return ResponseEntity.status(503).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
