package cm.hgd.medlab.controller;

import cm.hgd.medlab.dto.request.VerifyAccessCodeRequest;
import cm.hgd.medlab.dto.response.PatientResultResponse;
import cm.hgd.medlab.service.PatientResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Contrôleur public pour la consultation des résultats
 */
@RestController
@RequestMapping("/api/public/results")
@RequiredArgsConstructor
@Tag(name = "Public Access", description = "API publique pour consultation des résultats")
public class PublicResultController {

    private final PatientResultService patientResultService;

    @GetMapping("/{id}")
    @Operation(summary = "Informations du résultat", description = "Récupère les informations de base d'un résultat (sans le PDF)")
    public ResponseEntity<PatientResultResponse> getResultInfo(@PathVariable UUID id) {
        PatientResultResponse response = patientResultService.getResultById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/verify")
    @Operation(summary = "Vérifier le code d'accès", description = "Vérifie le code d'accès et retourne le lien PDF")
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
