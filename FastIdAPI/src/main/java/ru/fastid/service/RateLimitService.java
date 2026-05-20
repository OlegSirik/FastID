package ru.fastid.service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import ru.fastid.config.RateLimitProperties;

@Service
public class RateLimitService {

    private final RateLimitProperties properties;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public RateLimitService(RateLimitProperties properties) {
        this.properties = properties;
    }

    public boolean allow(String bucket, String clientKey, int limitPerMinute) {
        String key = bucket + ":" + clientKey;
        long window = Instant.now().getEpochSecond() / 60;
        WindowCounter counter = counters.compute(key, (k, existing) -> {
            if (existing == null || existing.window != window) {
                return new WindowCounter(window, 1);
            }
            existing.count++;
            return existing;
        });
        return counter.count <= limitPerMinute;
    }

    public boolean allowPremium(String clientKey) {
        return allow("premium", clientKey, properties.getPremiumPerMinute());
    }

    public boolean allowDecrypt(String clientKey) {
        return allow("decrypt", clientKey, properties.getDecryptPerMinute());
    }

    public boolean allowSecureLink(String clientKey) {
        return allow("secure-link", clientKey, properties.getSecureLinkPerMinute());
    }

    private static final class WindowCounter {
        private final long window;
        private int count;

        private WindowCounter(long window, int count) {
            this.window = window;
            this.count = count;
        }
    }
}
