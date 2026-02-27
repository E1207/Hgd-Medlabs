package cm.hgd.medlab.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service d'envoi d'emails via Resend API (HTTP)
 * Alternative à SMTP pour les plateformes qui bloquent les ports SMTP
 * 
 * Resend offre 3000 emails/mois gratuits
 * Documentation: https://resend.com/docs
 */
@Service
@Slf4j
public class ResendEmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    
    @Value("${medlab.email.resend.api-key:}")
    private String resendApiKey;
    
    @Value("${medlab.email.resend.enabled:false}")
    private boolean resendEnabled;
    
    @Value("${medlab.email.from}")
    private String fromEmail;

    @Value("${medlab.email.from-name}")
    private String fromName;

    @Value("${medlab.email.base-url}")
    private String baseUrl;
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public ResendEmailService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Vérifie si Resend est configuré et activé
     */
    public boolean isEnabled() {
        return resendEnabled && resendApiKey != null && !resendApiKey.isEmpty();
    }
    
    /**
     * Envoie un email via l'API Resend
     */
    private void sendEmail(String to, String subject, String htmlContent) {
        if (!isEnabled()) {
            log.warn("Resend n'est pas configuré. Email non envoyé à: {}", to);
            return;
        }
        
        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("from", fromName + " <" + fromEmail + ">");
            emailData.put("to", List.of(to));
            emailData.put("subject", subject);
            emailData.put("html", htmlContent);
            
            String jsonBody = objectMapper.writeValueAsString(emailData);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_API_URL))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(30))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email envoyé avec succès via Resend à: {}", to);
            } else {
                log.error("Erreur Resend - Status: {}, Response: {}", response.statusCode(), response.body());
                throw new RuntimeException("Erreur lors de l'envoi via Resend: " + response.body());
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email via Resend à: {}", to, e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email via Resend", e);
        }
    }
    
    /**
     * Envoie un email avec le lien pour consulter un résultat
     */
    @Async
    public void sendResultNotification(String toEmail, String patientName, String resultId, String referenceDossier) {
        log.info("Envoi de l'email de notification via Resend à: {}", toEmail);
        String htmlContent = getResultNotificationTemplate(patientName, referenceDossier, baseUrl + "/public/results/" + resultId);
        sendEmail(toEmail, "Vos résultats d'examens médicaux sont disponibles - HGD", htmlContent);
    }
    
    /**
     * Envoie le code d'accès par email
     */
    @Async
    public void sendAccessCode(String toEmail, String patientName, String accessCode) {
        log.info("Envoi du code d'accès via Resend à: {}", toEmail);
        String htmlContent = getAccessCodeTemplate(patientName, accessCode);
        sendEmail(toEmail, "Code d'accès à vos résultats - HGD", htmlContent);
    }
    
    /**
     * Envoie le code 2FA par email
     */
    @Async
    public void send2FACode(String toEmail, String userName, String code) {
        log.info("Envoi du code 2FA via Resend à: {}", toEmail);
        String htmlContent = get2FACodeTemplate(userName, code);
        sendEmail(toEmail, "Code de vérification - MedLab HGD", htmlContent);
    }

    // Templates HTML
    
    private String get2FACodeTemplate(String userName, String code) {
        return "<!DOCTYPE html>"
            + "<html><head><meta charset=\"UTF-8\"><style>"
            + "body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}"
            + ".header{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;}"
            + ".content{background:#f9f9f9;padding:30px;border:1px solid #e0e0e0;}"
            + ".code-box{background:white;padding:30px;text-align:center;border:3px solid #6366f1;border-radius:10px;margin:20px 0;}"
            + ".code{font-size:36px;font-weight:bold;color:#6366f1;letter-spacing:8px;font-family:'Courier New',monospace;}"
            + ".footer{text-align:center;padding:20px;font-size:12px;color:#666;border-top:1px solid #e0e0e0;}"
            + ".warning{background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;}"
            + "</style></head><body>"
            + "<div class=\"header\">"
            + "<h1>🔒 Authentification à 2 facteurs</h1>"
            + "<p>MedLab - Hôpital Général de Douala</p>"
            + "</div>"
            + "<div class=\"content\">"
            + "<h2>Bonjour " + userName + ",</h2>"
            + "<p>Une tentative de connexion à votre compte MedLab a été détectée. Veuillez utiliser le code ci-dessous pour confirmer votre identité:</p>"
            + "<div class=\"code-box\">"
            + "<p style=\"margin:0 0 10px 0;color:#666;\">Votre code de vérification:</p>"
            + "<div class=\"code\">" + code + "</div>"
            + "<p style=\"margin:15px 0 0 0;font-size:12px;color:#666;\">Ce code expire dans 5 minutes</p>"
            + "</div>"
            + "<div class=\"warning\">"
            + "<strong>⚠️ Attention:</strong> Si vous n'avez pas initié cette connexion, quelqu'un essaie peut-être d'accéder à votre compte. Ne partagez jamais ce code avec personne."
            + "</div>"
            + "<p style=\"font-size:12px;color:#666;margin-top:20px;\">"
            + "Date et heure: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + "</p>"
            + "</div>"
            + "<div class=\"footer\">"
            + "<p><strong>Hôpital Général de Douala</strong></p>"
            + "<p>MedLab - Système d'Information de Laboratoire</p>"
            + "<p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>"
            + "</div></body></html>";
    }

    private String getResultNotificationTemplate(String patientName, String referenceDossier, String resultUrl) {
        return "<!DOCTYPE html>"
            + "<html><head><meta charset=\"UTF-8\"><style>"
            + "body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}"
            + ".header{background:linear-gradient(135deg,#0066CC,#0052A3);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;}"
            + ".content{background:#f9f9f9;padding:30px;border:1px solid #e0e0e0;}"
            + ".button{display:inline-block;padding:15px 30px;background:#0066CC;color:white;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold;}"
            + ".footer{text-align:center;padding:20px;font-size:12px;color:#666;border-top:1px solid #e0e0e0;}"
            + ".info-box{background:white;padding:15px;border-left:4px solid #0066CC;margin:15px 0;}"
            + "</style></head><body>"
            + "<div class=\"header\">"
            + "<h1>🏥 Hôpital Général de Douala</h1>"
            + "<p>Laboratoire Médical</p>"
            + "</div>"
            + "<div class=\"content\">"
            + "<h2>Bonjour " + patientName + ",</h2>"
            + "<p>Vos résultats d'examens médicaux sont maintenant disponibles.</p>"
            + "<div class=\"info-box\">"
            + "<strong>Référence du dossier:</strong> " + referenceDossier
            + "</div>"
            + "<p>Pour consulter vos résultats en toute sécurité, veuillez cliquer sur le lien ci-dessous:</p>"
            + "<center><a href=\"" + resultUrl + "\" class=\"button\">Consulter mes résultats</a></center>"
            + "<p style=\"margin-top:20px;\">⚠️ <strong>Important:</strong> Un code d'accès vous sera envoyé dans un second email. Ce code vous sera demandé pour visualiser vos résultats.</p>"
            + "<p style=\"font-size:12px;color:#666;margin-top:20px;\">"
            + "Ce lien est personnel et sécurisé. Ne le partagez pas.<br>"
            + "Si vous n'avez pas demandé ces résultats, veuillez ignorer cet email.</p>"
            + "</div>"
            + "<div class=\"footer\">"
            + "<p><strong>Hôpital Général de Douala</strong></p>"
            + "<p>Laboratoire d'Analyses Médicales</p>"
            + "<p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>"
            + "</div></body></html>";
    }

    private String getAccessCodeTemplate(String patientName, String accessCode) {
        return "<!DOCTYPE html>"
            + "<html><head><meta charset=\"UTF-8\"><style>"
            + "body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}"
            + ".header{background:linear-gradient(135deg,#00A86B,#008556);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;}"
            + ".content{background:#f9f9f9;padding:30px;border:1px solid #e0e0e0;}"
            + ".code-box{background:white;padding:30px;text-align:center;border:3px solid #00A86B;border-radius:10px;margin:20px 0;}"
            + ".code{font-size:32px;font-weight:bold;color:#00A86B;letter-spacing:5px;font-family:'Courier New',monospace;}"
            + ".footer{text-align:center;padding:20px;font-size:12px;color:#666;border-top:1px solid #e0e0e0;}"
            + "</style></head><body>"
            + "<div class=\"header\">"
            + "<h1>🔐 Code d'Accès Sécurisé</h1>"
            + "<p>Hôpital Général de Douala</p>"
            + "</div>"
            + "<div class=\"content\">"
            + "<h2>Bonjour " + patientName + ",</h2>"
            + "<p>Voici votre code d'accès pour consulter vos résultats d'examens médicaux:</p>"
            + "<div class=\"code-box\">"
            + "<p>Votre code d'accès:</p>"
            + "<div class=\"code\">" + accessCode + "</div>"
            + "</div>"
            + "<p>⚠️ <strong>Ce code est à usage unique et strictement personnel.</strong></p>"
            + "<p>Ne le partagez avec personne.</p>"
            + "<p style=\"font-size:12px;color:#666;margin-top:20px;\">"
            + "Si vous n'avez pas demandé ce code, veuillez ignorer cet email et contacter immédiatement le laboratoire.</p>"
            + "</div>"
            + "<div class=\"footer\">"
            + "<p><strong>Hôpital Général de Douala</strong></p>"
            + "<p>Laboratoire d'Analyses Médicales</p>"
            + "<p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>"
            + "</div></body></html>";
    }
}
