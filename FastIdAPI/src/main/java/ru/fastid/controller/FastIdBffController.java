package ru.fastid.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.fastid.client.PolitechApiClient;
import ru.fastid.dto.FastIdDecryptRequest;
import ru.fastid.dto.FastIdPersonData;
import ru.fastid.dto.FastIdPremiumRequest;
import ru.fastid.dto.FastIdPremiumResponse;
import ru.fastid.dto.FastIdSecureLinkRequest;
import ru.fastid.service.BackendSessionService;
import ru.fastid.service.FastIdSecureLinkService;
import ru.fastid.service.RateLimitService;

@RestController
@RequestMapping("/api/public/v1/{tenantCode}/fastid")
public class FastIdBffController {

    private final BackendSessionService sessionService;
    private final PolitechApiClient apiClient;
    private final FastIdSecureLinkService secureLinkService;
    private final RateLimitService rateLimitService;

    public FastIdBffController(
            BackendSessionService sessionService,
            PolitechApiClient apiClient,
            FastIdSecureLinkService secureLinkService,
            RateLimitService rateLimitService) {
        this.sessionService = sessionService;
        this.apiClient = apiClient;
        this.secureLinkService = secureLinkService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/secure-link")
    public ResponseEntity<?> createSecureLink(
            @PathVariable String tenantCode,
            @RequestBody FastIdSecureLinkRequest request,
            HttpServletRequest httpRequest) {
        if (!rateLimitService.allowSecureLink(clientKey(httpRequest))) {
            return tooManyRequests();
        }
        return ResponseEntity.ok(secureLinkService.createSecureLink(request));
    }

    @PostMapping("/decrypt")
    public ResponseEntity<?> decrypt(
            @PathVariable String tenantCode,
            @RequestBody FastIdDecryptRequest request,
            HttpServletRequest httpRequest) {
        if (!rateLimitService.allowDecrypt(clientKey(httpRequest))) {
            return tooManyRequests();
        }
        FastIdPersonData response = secureLinkService.decodeSecuredData(request.getSecuredData());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/resolve")
    public ResponseEntity<?> resolve(
            @PathVariable String tenantCode,
            @RequestParam("q") String securedData,
            HttpServletRequest httpRequest) {
        if (!rateLimitService.allowDecrypt(clientKey(httpRequest))) {
            return tooManyRequests();
        }
        FastIdPersonData response = secureLinkService.decodeSecuredData(securedData);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/premium")
    public ResponseEntity<?> calculatePremium(
            @PathVariable String tenantCode,
            @RequestBody FastIdPremiumRequest request,
            HttpServletRequest httpRequest) {
        if (!rateLimitService.allowPremium(clientKey(httpRequest))) {
            return tooManyRequests();
        }
        FastIdPremiumResponse response = apiClient.calculatePremium(
            tenantCode,
            sessionService.requireAccessToken(),
            sessionService.requireAccountId(),
            request);
        return ResponseEntity.ok(response);
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static ResponseEntity<?> tooManyRequests() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body("{\"error\":\"Too many requests\"}");
    }
}
