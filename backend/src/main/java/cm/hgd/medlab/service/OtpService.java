package cm.hgd.medlab.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service pour gérer les codes OTP (One Time Password) pour le 2FA
 */
@Service
@Slf4j
public class OtpService {

    // Cache en mémoire pour stocker les codes OTP (en production, utiliser Redis)
    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();
    
    // Durée de validité du code OTP en minutes
    private static final int OTP_VALIDITY_MINUTES = 5;
    
    // Nombre de tentatives max
    private static final int MAX_ATTEMPTS = 3;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Génère un code OTP à 6 chiffres et l'associe à un token de session
     * @return OtpResult contenant le code et le token de session
     */
    public OtpResult generateOtp(String email) {
        // Nettoyer les anciens codes pour cet email
        cleanupOldOtps(email);
        
        // Générer un code à 6 chiffres
        String code = String.format("%06d", secureRandom.nextInt(1000000));
        
        // Générer un token de session unique
        String sessionToken = UUID.randomUUID().toString();
        
        // Stocker le code avec une date d'expiration
        OtpData otpData = new OtpData(
            code,
            email,
            LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES),
            0
        );
        otpCache.put(sessionToken, otpData);
        
        // NE PAS logger le code OTP en clair pour la sécurité!
        log.info("Code OTP généré pour {} (session: {}...)", email, sessionToken.substring(0, 8));
        
        return new OtpResult(code, sessionToken);
    }

    /**
     * Vérifie si le code OTP est valide
     */
    public boolean verifyOtp(String sessionToken, String code, String email) {
        OtpData otpData = otpCache.get(sessionToken);
        
        if (otpData == null) {
            log.warn("Session token invalide ou expiré: {}...", sessionToken != null ? sessionToken.substring(0, Math.min(8, sessionToken.length())) : "null");
            return false;
        }
        
        // Vérifier si le code a expiré
        if (LocalDateTime.now().isAfter(otpData.expiresAt)) {
            log.warn("Code OTP expiré pour {}", email);
            otpCache.remove(sessionToken);
            return false;
        }
        
        // Vérifier si l'email correspond
        if (!otpData.email.equals(email)) {
            log.warn("Email ne correspond pas: attendu={}, reçu={}", otpData.email, email);
            return false;
        }
        
        // Vérifier le nombre de tentatives
        if (otpData.attempts >= MAX_ATTEMPTS) {
            log.warn("Nombre max de tentatives atteint pour {}", email);
            otpCache.remove(sessionToken);
            return false;
        }
        
        // Vérifier le code
        if (!otpData.code.equals(code)) {
            otpData.attempts++;
            log.warn("Code OTP incorrect pour {} (tentative {})", email, otpData.attempts);
            return false;
        }
        
        // Code valide - supprimer du cache
        otpCache.remove(sessionToken);
        log.info("Code OTP validé avec succès pour {}", email);
        return true;
    }

    /**
     * Nettoyer les anciens codes pour un email donné
     */
    private void cleanupOldOtps(String email) {
        otpCache.entrySet().removeIf(entry -> 
            entry.getValue().email.equals(email) || 
            LocalDateTime.now().isAfter(entry.getValue().expiresAt)
        );
    }

    /**
     * Données d'un OTP stocké
     */
    private static class OtpData {
        String code;
        String email;
        LocalDateTime expiresAt;
        int attempts;

        OtpData(String code, String email, LocalDateTime expiresAt, int attempts) {
            this.code = code;
            this.email = email;
            this.expiresAt = expiresAt;
            this.attempts = attempts;
        }
    }

    /**
     * Résultat de la génération d'OTP
     */
    public record OtpResult(String code, String sessionToken) {}
}
