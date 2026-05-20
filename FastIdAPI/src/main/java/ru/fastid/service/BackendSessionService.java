package ru.fastid.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ru.fastid.client.PolitechApiClient;
import ru.fastid.config.PolitechProperties;
import ru.fastid.dto.PrincipalDto;
import ru.fastid.dto.SessionResponse;

@Service
public class BackendSessionService {

    private static final Logger log = LoggerFactory.getLogger(BackendSessionService.class);

    private final PolitechApiClient apiClient;
    private final PolitechProperties properties;

    private volatile String accessToken;
    private volatile PrincipalDto principal;
    private volatile String lastError;

    public BackendSessionService(PolitechApiClient apiClient, PolitechProperties properties) {
        this.apiClient = apiClient;
        this.properties = properties;
    }

    @PostConstruct
    public void init() {
        refreshSession();
    }

    public SessionResponse getSession() {
        if (principal != null && accessToken != null) {
            return SessionResponse.ready(
                principal.getTenantCode(),
                principal.getAccountId(),
                principal.getUsername());
        }
        refreshSession();
        if (principal != null && accessToken != null) {
            return SessionResponse.ready(
                principal.getTenantCode(),
                principal.getAccountId(),
                principal.getUsername());
        }
        return SessionResponse.failed(lastError != null ? lastError : "Backend session is not available");
    }

    public synchronized void refreshSession() {
        try {
            var token = apiClient.login(
                properties.getTenantCode(),
                properties.getUserLogin(),
                properties.getPassword(),
                properties.getClientId());
            if (token.getAccessToken() == null || token.getAccessToken().isBlank()) {
                lastError = token.getMessage() != null ? token.getMessage() : "Login failed";
                accessToken = null;
                principal = null;
                return;
            }
            accessToken = token.getAccessToken();
            principal = apiClient.getCurrentUser(properties.getTenantCode(), accessToken);
            lastError = null;
            log.info("PoliTech backend session established for tenant {}", properties.getTenantCode());
        } catch (Exception ex) {
            lastError = ex.getMessage() != null ? ex.getMessage() : "Login failed";
            accessToken = null;
            principal = null;
            log.error("Failed to establish PoliTech backend session: {}", lastError);
        }
    }

    public String requireAccessToken() {
        if (accessToken == null) {
            refreshSession();
        }
        if (accessToken == null) {
            throw new IllegalStateException(lastError != null ? lastError : "Backend session is not available");
        }
        return accessToken;
    }

    public Long requireAccountId() {
        if (principal == null || principal.getAccountId() == null) {
            refreshSession();
        }
        if (principal == null || principal.getAccountId() == null) {
            throw new IllegalStateException("Account id is not available");
        }
        return principal.getAccountId();
    }

    public String defaultTenant() {
        return properties.getTenantCode();
    }
}
