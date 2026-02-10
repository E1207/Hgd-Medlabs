package cm.hgd.medlab.controller;

import cm.hgd.medlab.dto.request.VerifyAccessCodeRequest;
import cm.hgd.medlab.dto.response.PatientResultResponse;
import cm.hgd.medlab.service.PatientResultService;
import cm.hgd.medlab.service.WhatsAppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Contrôleur public pour la consultation des résultats
 * Flux: Email -> Lien -> Code WhatsApp OTP -> PDF
 */
@RestController
@RequestMapping("/api/public/results")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public Access", description = "API publique pour consultation des résultats")
public class PublicResultController {

    private final PatientResultService patientResultService;
    private final WhatsAppService whatsAppService;

    @GetMapping("/{id}")
    @Operation(summary = "Informations du résultat", description = "Récupère les informations de base d'un résultat (sans le PDF)")
    public ResponseEntity<PatientResultResponse> getResultInfo(@PathVariable UUID id) {
        PatientResultResponse response = patientResultService.getResultById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Étape 1: Le patient clique sur le lien dans l'email
     * On envoie un code OTP par WhatsApp à son numéro
     */
    @PostMapping("/{id}/request-otp")
    @Operation(summary = "Demander un code OTP WhatsApp", 
               description = "Envoie un code OTP par WhatsApp au numéro du patient")
    public ResponseEntity<Map<String, Object>> requestOtp(@PathVariable UUID id) {
        PatientResultResponse result = patientResultService.getResultById(id);
        
        Map<String, Object> response = new HashMap<>();
        
        // Vérifier que le patient a un numéro de téléphone
        if (result.getPatientPhone() == null || result.getPatientPhone().isBlank()) {
            response.put("success", false);
            response.put("error", "NO_PHONE");
            response.put("message", "Aucun numéro de téléphone associé à ce résultat. Veuillez contacter le laboratoire.");
            return ResponseEntity.badRequest().body(response);
        }

        // Envoyer le code OTP par WhatsApp
        boolean sent = whatsAppService.sendOtpCode(result.getPatientPhone(), id.toString());
        
        if (sent) {
            response.put("success", true);
            response.put("message", "Un code de vérification a été envoyé par WhatsApp");
            response.put("maskedPhone", whatsAppService.getMaskedPhoneForOtp(id.toString()));
            response.put("expiresInMinutes", 10);
            response.put("whatsappEnabled", whatsAppService.isEnabled());
        } else {
            response.put("success", false);
            response.put("error", "SEND_FAILED");
            response.put("message", "Impossible d'envoyer le code. Veuillez réessayer.");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Étape 2: Le patient saisit le code OTP reçu par WhatsApp
     * Si valide, on retourne le lien de téléchargement du PDF
     */
    @PostMapping("/{id}/verify-otp")
    @Operation(summary = "Vérifier le code OTP WhatsApp", 
               description = "Vérifie le code OTP et donne accès au PDF")
    public ResponseEntity<Map<String, Object>> verifyOtp(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest
    ) {
        String otpCode = request.get("code");
        Map<String, Object> response = new HashMap<>();
        
        if (otpCode == null || otpCode.isBlank()) {
            response.put("success", false);
            response.put("error", "INVALID_CODE");
            response.put("message", "Veuillez saisir le code reçu par WhatsApp");
            return ResponseEntity.badRequest().body(response);
        }

        // Vérifier le code OTP
        boolean valid = whatsAppService.verifyOtpCode(id.toString(), otpCode.trim());
        
        if (valid) {
            // Marquer le résultat comme consulté
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            patientResultService.markAsOpened(id, ipAddress, userAgent);
            
            response.put("success", true);
            response.put("message", "Code vérifié avec succès");
            response.put("downloadUrl", "/api/public/results/" + id + "/download");
            response.put("accessGranted", true);
            
            log.info("Accès au résultat {} autorisé après vérification OTP WhatsApp", id);
        } else {
            response.put("success", false);
            response.put("error", "INVALID_OTP");
            response.put("message", "Code invalide ou expiré. Veuillez réessayer.");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Renvoyer un code OTP
     */
    @PostMapping("/{id}/resend-otp")
    @Operation(summary = "Renvoyer le code OTP", description = "Renvoie un nouveau code OTP par WhatsApp")
    public ResponseEntity<Map<String, Object>> resendOtp(@PathVariable UUID id) {
        return requestOtp(id);
    }

    @PostMapping("/{id}/verify")
    @Operation(summary = "Vérifier le code d'accès (legacy)", description = "Méthode legacy - Vérifie le code d'accès email")
    public ResponseEntity<Map<String, Object>> verifyAccessCode(
            @PathVariable UUID id,
            @Valid @RequestBody VerifyAccessCodeRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        Map<String, Object> response = patientResultService.verifyAccessCodeAndGetResult(
                id, request, ipAddress, userAgent
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Télécharger le PDF après vérification", description = "Télécharge le PDF après validation du code")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) throws IOException {
        byte[] pdfContent = patientResultService.getResultPdf(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "resultat.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfContent);
    }

    /**
     * Récupère l'adresse IP du client
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headers = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0];
            }
        }

        return request.getRemoteAddr();
    }
}
