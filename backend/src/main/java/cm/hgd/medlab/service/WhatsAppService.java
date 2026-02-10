package cm.hgd.medlab.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service d'envoi de messages WhatsApp via l'API Meta Cloud
 * Utilisé pour l'authentification à deux facteurs (2FA) des résultats médicaux
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class WhatsAppService {

    @Value("${medlab.whatsapp.api-url:https://graph.facebook.com/v18.0}")
    private String apiUrl;

    @Value("${medlab.whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${medlab.whatsapp.access-token:}")
    private String accessToken;

    @Value("${medlab.whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    // Durée de validité du code OTP en minutes
    @Value("${medlab.whatsapp.otp-validity-minutes:10}")
    private int otpValidityMinutes;

    // Stockage temporaire des codes OTP (en production, utiliser Redis)
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    private final RestTemplate restTemplate = new RestTemplate();
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Données d'un code OTP
     */
    private static class OtpData {
        String code;
        LocalDateTime expiresAt;
        int attempts;
        String phoneNumber;

        OtpData(String code, LocalDateTime expiresAt, String phoneNumber) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.attempts = 0;
            this.phoneNumber = phoneNumber;
        }
    }

    /**
     * Génère et envoie un code OTP par WhatsApp
     * @param phoneNumber Numéro de téléphone au format international (ex: +237699123456)
     * @param resultId Identifiant du résultat (utilisé comme clé pour le stockage OTP)
     * @return true si l'envoi a réussi
     */
    public boolean sendOtpCode(String phoneNumber, String resultId) {
        if (!whatsappEnabled) {
            log.warn("WhatsApp est désactivé. Simulation d'envoi OTP pour le numéro: {}", maskPhoneNumber(phoneNumber));
            // En mode simulation, on génère quand même un code pour les tests
            String code = generateOtpCode();
            storeOtp(resultId, code, phoneNumber);
            log.info("🔐 CODE OTP SIMULATION pour {}: {}", resultId, code);
            return true;
        }

        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.error("Numéro de téléphone invalide");
            return false;
        }

        String formattedPhone = formatPhoneNumber(phoneNumber);
        String otpCode = generateOtpCode();

        try {
            boolean sent = sendWhatsAppMessage(formattedPhone, otpCode);
            if (sent) {
                storeOtp(resultId, otpCode, formattedPhone);
                log.info("Code OTP envoyé avec succès à {} pour le résultat {}", 
                        maskPhoneNumber(formattedPhone), resultId);
            }
            return sent;
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code OTP WhatsApp: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Vérifie un code OTP
     * @param resultId Identifiant du résultat
     * @param code Code OTP saisi par l'utilisateur
     * @return true si le code est valide
     */
    public boolean verifyOtpCode(String resultId, String code) {
        OtpData otpData = otpStore.get(resultId);

        if (otpData == null) {
            log.warn("Aucun code OTP trouvé pour le résultat: {}", resultId);
            return false;
        }

        // Vérifier l'expiration
        if (LocalDateTime.now().isAfter(otpData.expiresAt)) {
            log.warn("Code OTP expiré pour le résultat: {}", resultId);
            otpStore.remove(resultId);
            return false;
        }

        // Vérifier le nombre de tentatives (max 3)
        if (otpData.attempts >= 3) {
            log.warn("Trop de tentatives pour le résultat: {}", resultId);
            otpStore.remove(resultId);
            return false;
        }

        otpData.attempts++;

        // Vérifier le code
        if (otpData.code.equals(code)) {
            log.info("Code OTP vérifié avec succès pour le résultat: {}", resultId);
            otpStore.remove(resultId); // Supprimer après utilisation
            return true;
        }

        log.warn("Code OTP invalide pour le résultat: {} (tentative {}/3)", resultId, otpData.attempts);
        return false;
    }

    /**
     * Vérifie si un OTP est en attente pour un résultat
     */
    public boolean hasActiveOtp(String resultId) {
        OtpData otpData = otpStore.get(resultId);
        if (otpData == null) {
            return false;
        }
        // Vérifier si non expiré
        if (LocalDateTime.now().isAfter(otpData.expiresAt)) {
            otpStore.remove(resultId);
            return false;
        }
        return true;
    }

    /**
     * Récupère le numéro de téléphone masqué associé à un OTP
     */
    public String getMaskedPhoneForOtp(String resultId) {
        OtpData otpData = otpStore.get(resultId);
        if (otpData != null) {
            return maskPhoneNumber(otpData.phoneNumber);
        }
        return null;
    }

    /**
     * Envoie un message WhatsApp via l'API Meta Cloud
     */
    private boolean sendWhatsAppMessage(String phoneNumber, String otpCode) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // Corps du message - Message texte direct
        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("recipient_type", "individual");
        body.put("to", phoneNumber.replace("+", ""));
        body.put("type", "text");

        // Message texte avec le code OTP
        String message = String.format(
            "🏥 *Hôpital Général de Douala - MedLab*\n\n" +
            "Votre code de vérification est: *%s*\n\n" +
            "Ce code expire dans %d minutes.\n" +
            "Ne partagez ce code avec personne.\n\n" +
            "Si vous n'avez pas demandé ce code, ignorez ce message.",
            otpCode, otpValidityMinutes
        );
        body.put("text", Map.of("body", message));

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            log.info("Envoi WhatsApp à: {}", maskPhoneNumber(phoneNumber));
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ WhatsApp envoyé avec succès! Response: {}", response.getBody());
                return true;
            } else {
                log.error("❌ Erreur WhatsApp API: {} - {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Exception WhatsApp API: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Génère un code OTP à 6 chiffres
     */
    private String generateOtpCode() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * Stocke un code OTP
     */
    private void storeOtp(String resultId, String code, String phoneNumber) {
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpValidityMinutes);
        otpStore.put(resultId, new OtpData(code, expiresAt, phoneNumber));
    }

    /**
     * Formate le numéro de téléphone au format international
     */
    private String formatPhoneNumber(String phoneNumber) {
        String cleaned = phoneNumber.replaceAll("[^0-9+]", "");
        
        // Si le numéro commence par 6 ou 2 (Cameroun), ajouter +237
        if (cleaned.matches("^[62]\\d{8}$")) {
            return "+237" + cleaned;
        }
        
        // Si le numéro n'a pas de +, l'ajouter
        if (!cleaned.startsWith("+")) {
            cleaned = "+" + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Masque un numéro de téléphone pour l'affichage
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 6) {
            return "***";
        }
        int visibleStart = phoneNumber.startsWith("+") ? 4 : 3;
        int visibleEnd = 2;
        return phoneNumber.substring(0, visibleStart) + 
               "*".repeat(phoneNumber.length() - visibleStart - visibleEnd) + 
               phoneNumber.substring(phoneNumber.length() - visibleEnd);
    }

    /**
     * Vérifie si WhatsApp est activé
     */
    public boolean isEnabled() {
        return whatsappEnabled;
    }
}
