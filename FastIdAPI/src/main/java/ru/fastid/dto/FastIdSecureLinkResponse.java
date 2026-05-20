package ru.fastid.dto;

import java.math.BigDecimal;

public class FastIdSecureLinkResponse {

    private String url;
    private String securedToken;
    private String qrImageDataUri;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getSecuredToken() {
        return securedToken;
    }

    public void setSecuredToken(String securedToken) {
        this.securedToken = securedToken;
    }

    public String getQrImageDataUri() {
        return qrImageDataUri;
    }

    public void setQrImageDataUri(String qrImageDataUri) {
        this.qrImageDataUri = qrImageDataUri;
    }
}
