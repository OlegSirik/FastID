package ru.fastid.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fastid.secure-link")
public class FastIdSecureLinkProperties {

    private String secret = "change-me-in-production";
    private int qrSize = 256;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public int getQrSize() {
        return qrSize;
    }

    public void setQrSize(int qrSize) {
        this.qrSize = qrSize;
    }
}
