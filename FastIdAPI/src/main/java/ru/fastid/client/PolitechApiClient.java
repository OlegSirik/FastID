package ru.fastid.client;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import ru.fastid.config.PolitechProperties;
import ru.fastid.dto.FastIdPremiumRequest;
import ru.fastid.dto.FastIdPremiumResponse;
import ru.fastid.dto.LoginRequest;
import ru.fastid.dto.PrincipalDto;
import ru.fastid.dto.TokenResponse;

@Component
public class PolitechApiClient {

    private final RestClient restClient;
    private final PolitechProperties properties;

    public PolitechApiClient(PolitechProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
            .baseUrl(trimTrailingSlash(properties.getApiUrl()))
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    public TokenResponse login(String tenantCode, String userLogin, String password, String clientId) {
        LoginRequest body = new LoginRequest(userLogin, password, clientId);
        try {
            return restClient.post()
                .uri("/api/v1/{tenant}/auth/login", tenantCode)
                .body(body)
                .retrieve()
                .body(TokenResponse.class);
        } catch (RestClientResponseException ex) {
            TokenResponse response = new TokenResponse();
            response.setMessage(ex.getResponseBodyAsString());
            return response;
        }
    }

    public PrincipalDto getCurrentUser(String tenantCode, String accessToken) {
        return restClient.get()
            .uri("/api/v1/{tenant}/auth/me", tenantCode)
            .headers(headers -> applyAuthHeaders(headers, accessToken, null))
            .retrieve()
            .body(PrincipalDto.class);
    }

    public FastIdPremiumResponse calculatePremium(
            String tenantCode,
            String accessToken,
            Long accountId,
            FastIdPremiumRequest request) {
        return restClient.post()
            .uri("/api/v1/{tenant}/fastid/premium", tenantCode)
            .headers(headers -> applyAuthHeaders(headers, accessToken, accountId))
            .body(request)
            .retrieve()
            .body(FastIdPremiumResponse.class);
    }

    private void applyAuthHeaders(HttpHeaders headers, String accessToken, Long accountId) {
        headers.setBearerAuth(accessToken);
        headers.set(properties.getClientHeader(), properties.getClientHeaderValue());
        if (accountId != null) {
            headers.set("X-Account-Id", String.valueOf(accountId));
        }
    }

    private static String trimTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
