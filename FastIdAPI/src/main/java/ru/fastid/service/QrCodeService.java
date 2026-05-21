package ru.fastid.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import org.springframework.stereotype.Service;
import ru.fastid.config.FastIdSecureLinkProperties;

@Service
public class QrCodeService {

    private final FastIdSecureLinkProperties properties;

    public QrCodeService(FastIdSecureLinkProperties properties) {
        this.properties = properties;
    }

    public String toDataUri(String content) {
        try {
            int size = Math.max(128, properties.getQrSize());
            BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            String base64 = Base64.getEncoder().encodeToString(output.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate QR code", ex);
        }
    }
}
