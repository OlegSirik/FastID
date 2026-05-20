package ru.fastid.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fastid.rate-limit")
public class RateLimitProperties {

    private int premiumPerMinute = 10;
    private int decryptPerMinute = 20;
    private int secureLinkPerMinute = 10;

    public int getPremiumPerMinute() {
        return premiumPerMinute;
    }

    public void setPremiumPerMinute(int premiumPerMinute) {
        this.premiumPerMinute = premiumPerMinute;
    }

    public int getDecryptPerMinute() {
        return decryptPerMinute;
    }

    public void setDecryptPerMinute(int decryptPerMinute) {
        this.decryptPerMinute = decryptPerMinute;
    }

    public int getSecureLinkPerMinute() {
        return secureLinkPerMinute;
    }

    public void setSecureLinkPerMinute(int secureLinkPerMinute) {
        this.secureLinkPerMinute = secureLinkPerMinute;
    }
}
