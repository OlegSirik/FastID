package ru.fastid.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "politech")
public class PolitechProperties {

    private String apiUrl = "http://localhost:8080";
    private String tenantCode = "demo";
    private String userLogin = "demo";
    private String password = "demo";
    private String clientId = "sys";
    private String clientHeader = "X-Pt-Client";
    private String clientHeaderValue = "PoliTechFront";

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getUserLogin() {
        return userLogin;
    }

    public void setUserLogin(String userLogin) {
        this.userLogin = userLogin;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientHeader() {
        return clientHeader;
    }

    public void setClientHeader(String clientHeader) {
        this.clientHeader = clientHeader;
    }

    public String getClientHeaderValue() {
        return clientHeaderValue;
    }

    public void setClientHeaderValue(String clientHeaderValue) {
        this.clientHeaderValue = clientHeaderValue;
    }
}
