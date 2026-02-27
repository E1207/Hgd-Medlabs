package cm.hgd.medlab.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service de routage des emails
 * Utilise Resend (API HTTP) si configuré, sinon fallback sur SMTP classique
 * 
 * Resend est préféré car les plateformes cloud (Render, Railway) bloquent souvent les ports SMTP
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailRoutingService {

    private final EmailService smtpEmailService;
    private final ResendEmailService resendEmailService;
    
    /**
     * Envoie un email avec le lien pour consulter un résultat
     */
    public void sendResultNotification(String toEmail, String patientName, String resultId, String referenceDossier) {
        if (resendEmailService.isEnabled()) {
            log.info("Utilisation de Resend pour l'envoi de la notification");
            resendEmailService.sendResultNotification(toEmail, patientName, resultId, referenceDossier);
        } else {
            log.info("Utilisation de SMTP pour l'envoi de la notification");
            smtpEmailService.sendResultNotification(toEmail, patientName, resultId, referenceDossier);
        }
    }
    
    /**
     * Envoie le code d'accès par email
     */
    public void sendAccessCode(String toEmail, String patientName, String accessCode) {
        if (resendEmailService.isEnabled()) {
            log.info("Utilisation de Resend pour l'envoi du code d'accès");
            resendEmailService.sendAccessCode(toEmail, patientName, accessCode);
        } else {
            log.info("Utilisation de SMTP pour l'envoi du code d'accès");
            smtpEmailService.sendAccessCode(toEmail, patientName, accessCode);
        }
    }
    
    /**
     * Envoie le code 2FA par email
     */
    public void send2FACode(String toEmail, String userName, String code) {
        if (resendEmailService.isEnabled()) {
            log.info("Utilisation de Resend pour l'envoi du code 2FA");
            resendEmailService.send2FACode(toEmail, userName, code);
        } else {
            log.info("Utilisation de SMTP pour l'envoi du code 2FA");
            smtpEmailService.send2FACode(toEmail, userName, code);
        }
    }
}
