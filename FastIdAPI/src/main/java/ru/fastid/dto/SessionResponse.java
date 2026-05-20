package ru.fastid.dto;

public class SessionResponse {

    private boolean ready;
    private String tenantCode;
    private Long accountId;
    private String username;
    private String message;

    public static SessionResponse ready(String tenantCode, Long accountId, String username) {
        SessionResponse response = new SessionResponse();
        response.ready = true;
        response.tenantCode = tenantCode;
        response.accountId = accountId;
        response.username = username;
        return response;
    }

    public static SessionResponse failed(String message) {
        SessionResponse response = new SessionResponse();
        response.ready = false;
        response.message = message;
        return response;
    }

    public boolean isReady() {
        return ready;
    }

    public void setReady(boolean ready) {
        this.ready = ready;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
