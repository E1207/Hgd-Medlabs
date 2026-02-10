package cm.hgd.medlab.controller;

import cm.hgd.medlab.dto.PdfMetadata;
import cm.hgd.medlab.dto.request.PatientResultRequest;
import cm.hgd.medlab.dto.response.PatientResultResponse;
import cm.hgd.medlab.model.enums.ResultStatus;
import cm.hgd.medlab.service.FileService;
import cm.hgd.medlab.service.PatientResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Contrôleur pour la gestion des résultats patients
 */
@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
@Tag(name = "Patient Results", description = "API de gestion des résultats patients")
public class PatientResultController {

    private final PatientResultService patientResultService;
    private final FileService fileService;

    @PostMapping(value = "/extract-metadata", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extraire les métadonnées d'un PDF", description = "Extrait référence, nom, prénom depuis un PDF HGD")
    public ResponseEntity<PdfMetadata> extractMetadata(@RequestPart("file") MultipartFile file) throws IOException {
        PdfMetadata metadata = fileService.extractMetadataFromMultipart(file);
        return ResponseEntity.ok(metadata);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload manuel d'un résultat", description = "Upload un PDF et crée un résultat patient")
    public ResponseEntity<PatientResultResponse> uploadResult(
            @RequestPart("file") MultipartFile file,
            @RequestPart("data") @Valid PatientResultRequest request
    ) throws IOException {
        PatientResultResponse response = patientResultService.uploadResult(file, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Compléter un résultat", description = "Complète un résultat importé automatiquement")
    public ResponseEntity<PatientResultResponse> completeResult(
            @PathVariable UUID id,
            @Valid @RequestBody PatientResultRequest request
    ) {
        PatientResultResponse response = patientResultService.completeResult(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Envoyer un résultat", description = "Envoie un résultat par email au patient")
    public ResponseEntity<PatientResultResponse> sendResult(@PathVariable UUID id) {
        PatientResultResponse response = patientResultService.sendResult(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Liste des résultats", description = "Récupère tous les résultats avec filtres et pagination")
    public ResponseEntity<Page<PatientResultResponse>> getAllResults(
            @RequestParam(required = false) ResultStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<PatientResultResponse> results = patientResultService.getAllResults(
                status, startDate, endDate, search, page, size
        );
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détails d'un résultat", description = "Récupère les détails d'un résultat")
    public ResponseEntity<PatientResultResponse> getResultById(@PathVariable UUID id) {
        PatientResultResponse response = patientResultService.getResultById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Télécharger le PDF", description = "Télécharge le fichier PDF d'un résultat")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) throws IOException {
        byte[] pdfContent = patientResultService.getResultPdf(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "resultat.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfContent);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un résultat", description = "Supprime un résultat (admin uniquement)")
    public ResponseEntity<Void> deleteResult(@PathVariable UUID id) throws IOException {
        patientResultService.deleteResult(id);
        return ResponseEntity.noContent().build();
    }
}
