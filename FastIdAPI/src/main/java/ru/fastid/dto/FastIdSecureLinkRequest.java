package ru.fastid.dto;

public class FastIdSecureLinkRequest extends FastIdPersonData {

    private String baseUrl;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
}
