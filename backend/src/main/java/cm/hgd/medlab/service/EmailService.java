package cm.hgd.medlab.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Service pour l'envoi d'emails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${medlab.email.from}")
    private String fromEmail;

    @Value("${medlab.email.from-name}")
    private String fromName;

    @Value("${medlab.email.base-url}")
    private String baseUrl;

    /**
     * Envoie un email avec le lien pour consulter un résultat
     */
    @Async
    public void sendResultNotification(String toEmail, String patientName, String resultId, String referenceDossier) {
        log.info("Envoi de l'email de notification à: {}", toEmail);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Vos résultats d'examens médicaux sont disponibles - HGD");

            Context context = new Context();
            context.setVariable("patientName", patientName);
            context.setVariable("referenceDossier", referenceDossier);
            context.setVariable("resultUrl", baseUrl + "/public/results/" + resultId);

            String htmlContent = getResultNotificationTemplate(context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email envoyé avec succès à: {}", toEmail);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à: {}", toEmail, e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    /**
     * Envoie le code d'accès par email (alternative au SMS)
     */
    @Async
    public void sendAccessCode(String toEmail, String patientName, String accessCode) {
        log.info("Envoi du code d'accès à: {}", toEmail);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Code d'accès à vos résultats - HGD");

            Context context = new Context();
            context.setVariable("patientName", patientName);
            context.setVariable("accessCode", accessCode);

            String htmlContent = getAccessCodeTemplate(context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Code d'accès envoyé avec succès à: {}", toEmail);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code d'accès à: {}", toEmail, e);
            throw new RuntimeException("Erreur lors de l'envoi du code", e);
        }
    }

    /**
     * Template HTML pour la notification de résultat
     */
    private String getResultNotificationTemplate(Context context) {
        String patientName = (String) context.getVariable("patientName");
        String referenceDossier = (String) context.getVariable("referenceDossier");
        String resultUrl = (String) context.getVariable("resultUrl");

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
            + "<h1>\uD83C\uDFE5 Hôpital Général de Douala</h1>"
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

    /**
     * Template HTML pour l'envoi du code d'accès
     */
    private String getAccessCodeTemplate(Context context) {
        String patientName = (String) context.getVariable("patientName");
        String accessCode = (String) context.getVariable("accessCode");

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
            + "<h1>\uD83D\uDD10 Code d'Accès Sécurisé</h1>"
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
