package ru.fastid.service;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import ru.fastid.config.FastIdSecureLinkProperties;
import ru.fastid.dto.FastIdPersonData;
import ru.fastid.dto.FastIdSecureLinkRequest;
import ru.fastid.dto.FastIdSecureLinkResponse;

@Service
public class FastIdSecureLinkService {

    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final int PERSON_FIELD_COUNT = 6;
    private static final char FIELD_SEPARATOR = ';';

    private final FastIdSecureLinkProperties properties;
    private final QrCodeService qrCodeService;
    private final SecureRandom secureRandom = new SecureRandom();

    public FastIdSecureLinkService(
            FastIdSecureLinkProperties properties,
            QrCodeService qrCodeService) {
        this.properties = properties;
        this.qrCodeService = qrCodeService;
    }

    public FastIdSecureLinkResponse createSecureLink(FastIdSecureLinkRequest request) {
        validatePerson(request);
        if (request.getBaseUrl() == null || request.getBaseUrl().isBlank()) {
            throw new IllegalArgumentException("baseUrl is required");
        }
        String baseUrl = normalizeBaseUrl(request.getBaseUrl());
        String securedToken = encodePerson(request);
        String url = baseUrl + "/start?q=" + securedToken;

        FastIdSecureLinkResponse response = new FastIdSecureLinkResponse();
        response.setSecuredToken(securedToken);
        response.setUrl(url);
        response.setQrImageDataUri(qrCodeService.toDataUri(url));
        return response;
    }

    public FastIdPersonData decodeSecuredData(String securedData) {
        if (securedData == null || securedData.isBlank()) {
            throw new IllegalArgumentException("securedData is required");
        }
        String token = URLDecoder.decode(securedData.trim(), StandardCharsets.UTF_8);
        try {
            byte[] payload = decodeToken(token);
            return deserializePerson(new String(payload, StandardCharsets.UTF_8));
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid or corrupted secure link token", ex);
        }
    }

    private String encodePerson(FastIdPersonData person) {
        try {
            String payload = serializePerson(person);
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            byte[] tokenBytes = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, tokenBytes, 0, iv.length);
            System.arraycopy(ciphertext, 0, tokenBytes, iv.length, ciphertext.length);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to encode secure link token", ex);
        }
    }

    /** firstName;lastName;middleName;dob;seria;number */
    private static String serializePerson(FastIdPersonData person) {
        return String.join(
            String.valueOf(FIELD_SEPARATOR),
            person.getFirstName().trim(),
            person.getLastName().trim(),
            person.getMiddleName().trim(),
            person.getDateOfBirth().trim(),
            person.getPassportSeria().trim(),
            person.getPassportNumber().trim());
    }

    private static FastIdPersonData deserializePerson(String payload) {
        String[] parts = payload.split(String.valueOf(FIELD_SEPARATOR), -1);
        if (parts.length != PERSON_FIELD_COUNT) {
            throw new IllegalArgumentException("Invalid secure link payload");
        }
        FastIdPersonData person = new FastIdPersonData();
        person.setFirstName(parts[0]);
        person.setLastName(parts[1]);
        person.setMiddleName(parts[2]);
        person.setDateOfBirth(parts[3]);
        person.setPassportSeria(parts[4]);
        person.setPassportNumber(parts[5]);
        return person;
    }

    private byte[] decodeToken(String token) {
        byte[] tokenBytes;
        try {
            tokenBytes = Base64.getUrlDecoder().decode(token);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid secure link token encoding", ex);
        }
        if (tokenBytes.length <= GCM_IV_LENGTH) {
            throw new IllegalArgumentException("Invalid secure link token");
        }

        byte[] iv = new byte[GCM_IV_LENGTH];
        byte[] ciphertext = new byte[tokenBytes.length - GCM_IV_LENGTH];
        System.arraycopy(tokenBytes, 0, iv, 0, GCM_IV_LENGTH);
        System.arraycopy(tokenBytes, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            return cipher.doFinal(ciphertext);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid or corrupted secure link token", ex);
        }
    }

    private SecretKeySpec secretKey() {
        try {
            byte[] key = MessageDigest.getInstance("SHA-256")
                .digest(properties.getSecret().getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(key, "AES");
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to derive secure link key", ex);
        }
    }

    private static void validatePerson(FastIdPersonData person) {
        requireText(person.getFirstName(), "firstName");
        requireText(person.getLastName(), "lastName");
        requireText(person.getMiddleName(), "middleName");
        requireText(person.getDateOfBirth(), "dateOfBirth");
        requireText(person.getPassportSeria(), "passportSeria");
        requireText(person.getPassportNumber(), "passportNumber");
    }

    private static void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        if (value.indexOf(FIELD_SEPARATOR) >= 0) {
            throw new IllegalArgumentException(field + " must not contain ';'");
        }
    }

    private static String normalizeBaseUrl(String baseUrl) {
        return baseUrl.trim().replaceAll("/+$", "");
    }
}
