package cm.hgd.medlab.service;

import cm.hgd.medlab.dto.PdfMetadata;
import cm.hgd.medlab.dto.request.PatientResultRequest;
import cm.hgd.medlab.dto.request.VerifyAccessCodeRequest;
import cm.hgd.medlab.dto.response.DashboardStatsResponse;
import cm.hgd.medlab.dto.response.PatientResultResponse;
import cm.hgd.medlab.model.entity.AccessLog;
import cm.hgd.medlab.model.entity.PatientResult;
import cm.hgd.medlab.model.entity.User;
import cm.hgd.medlab.model.enums.ImportMethod;
import cm.hgd.medlab.model.enums.ResultStatus;
import cm.hgd.medlab.repository.AccessLogRepository;
import cm.hgd.medlab.repository.PatientResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des résultats patients
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatientResultService {

    private final PatientResultRepository patientResultRepository;
    private final AccessLogRepository accessLogRepository;
    private final FileService fileService;
    private final EmailRoutingService emailService;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final EncryptionService encryptionService;

    @Value("${medlab.security.access-code-length}")
    private int accessCodeLength;

    @Value("${medlab.security.max-access-attempts}")
    private int maxAccessAttempts;

    private static final String ACCESS_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    /**
     * Upload manuel d'un résultat avec extraction automatique des métadonnées
     * Le PDF est CHIFFRÉ avec AES-256 puis stocké dans PostgreSQL
     */
    @Transactional
    public PatientResultResponse uploadResult(MultipartFile file, PatientResultRequest request) throws IOException {
        log.info("Upload manuel d'un résultat pour la référence: {}", request.getReferenceDossier());

        // Vérifier si la référence existe déjà
        if (patientResultRepository.existsByReferenceDossier(request.getReferenceDossier())) {
            throw new RuntimeException("Un résultat existe déjà avec cette référence: " + request.getReferenceDossier());
        }

        // Lire le contenu du PDF
        byte[] pdfContent = file.getBytes();
        long originalSize = pdfContent.length;
        
        // CHIFFRER le PDF avant stockage (AES-256-GCM)
        byte[] encryptedContent = encryptionService.encrypt(pdfContent);
        log.info("PDF chiffré: {} Ko -> {} Ko", originalSize / 1024, encryptedContent.length / 1024);
        
        // Récupérer l'utilisateur connecté
        User currentUser = authService.getCurrentUser();

        // Créer le résultat avec le PDF CHIFFRÉ stocké en base
        PatientResult result = PatientResult.builder()
                .referenceDossier(request.getReferenceDossier())
                .patientFirstName(request.getPatientFirstName())
                .patientLastName(request.getPatientLastName())
                .patientBirthdate(request.getPatientBirthdate())
                .patientEmail(request.getPatientEmail())
                .patientPhone(request.getPatientPhone())
                .pdfContent(encryptedContent)  // PDF CHIFFRÉ en base
                .pdfFileSize(originalSize)     // Taille originale (avant chiffrement)
                .pdfContentType("application/pdf")
                .pdfFileName(file.getOriginalFilename())
                .status(ResultStatus.COMPLETED)
                .importMethod(ImportMethod.MANUAL)
                .importedAt(LocalDateTime.now())
                .importedBy(currentUser)
                .build();

        result = patientResultRepository.save(result);
        log.info("Résultat créé avec succès (PDF chiffré AES-256): {} ({} Ko)", 
                result.getId(), originalSize / 1024);

        return convertToResponse(result);
    }

    /**
     * Import automatique d'un résultat depuis le scheduler
     * Le PDF est lu depuis le disque, CHIFFRÉ puis stocké dans PostgreSQL
     */
    @Transactional
    public PatientResult importResultFromFile(String filePath, String fileName) throws IOException {
        log.info("Import automatique du fichier: {}", fileName);

        // Lire le contenu du PDF
        java.io.File file = new java.io.File(filePath);
        byte[] pdfContent = java.nio.file.Files.readAllBytes(file.toPath());
        long originalSize = pdfContent.length;

        // Extraire les métadonnées du PDF AVANT chiffrement
        PdfMetadata metadata = fileService.extractMetadata(filePath);

        // Générer une référence si non trouvée
        String referenceDossier = metadata.getReferenceDossier();
        if (referenceDossier == null || referenceDossier.isEmpty()) {
            referenceDossier = "AUTO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        // Vérifier si la référence existe déjà
        if (patientResultRepository.existsByReferenceDossier(referenceDossier)) {
            log.warn("Résultat déjà existant avec la référence: {}", referenceDossier);
            return null;
        }

        // CHIFFRER le PDF avant stockage (AES-256-GCM)
        byte[] encryptedContent = encryptionService.encrypt(pdfContent);
        log.info("PDF chiffré: {} Ko -> {} Ko", originalSize / 1024, encryptedContent.length / 1024);

        // Créer le résultat avec le PDF CHIFFRÉ stocké en base
        PatientResult result = PatientResult.builder()
                .referenceDossier(referenceDossier)
                .patientFirstName(metadata.getFirstName())
                .patientLastName(metadata.getLastName())
                .patientBirthdate(metadata.getBirthdate())
                .patientEmail(metadata.getEmail())
                .patientPhone(metadata.getPhone())
                .pdfContent(encryptedContent)  // PDF CHIFFRÉ en base
                .pdfFileSize(originalSize)     // Taille originale
                .pdfContentType("application/pdf")
                .pdfFileName(fileName)
                .status(ResultStatus.IMPORTED)
                .importMethod(ImportMethod.AUTO)
                .importedAt(LocalDateTime.now())
                .build();

        result = patientResultRepository.save(result);
        log.info("Résultat importé (PDF chiffré AES-256): {} - Réf: {} ({} Ko)", 
                result.getId(), referenceDossier, originalSize / 1024);

        return result;
    }

    /**
     * Complète un résultat importé automatiquement
     */
    @Transactional
    public PatientResultResponse completeResult(UUID resultId, PatientResultRequest request) {
        log.info("Complétion du résultat: {}", resultId);

        PatientResult result = patientResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé avec l'ID: " + resultId));

        if (result.getStatus() != ResultStatus.IMPORTED) {
            throw new RuntimeException("Seuls les résultats importés peuvent être complétés");
        }

        // Mettre à jour les informations
        result.setPatientFirstName(request.getPatientFirstName());
        result.setPatientLastName(request.getPatientLastName());
        result.setPatientBirthdate(request.getPatientBirthdate());
        result.setPatientEmail(request.getPatientEmail());
        result.setPatientPhone(request.getPatientPhone());
        result.setStatus(ResultStatus.COMPLETED);

        result = patientResultRepository.save(result);
        log.info("Résultat complété: {}", result.getId());

        return convertToResponse(result);
    }

    /**
     * Envoie un résultat au patient
     */
    @Transactional
    public PatientResultResponse sendResult(UUID resultId) {
        log.info("Envoi du résultat: {}", resultId);

        PatientResult result = patientResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé avec l'ID: " + resultId));

        if (result.getStatus() != ResultStatus.COMPLETED && result.getStatus() != ResultStatus.SENT) {
            throw new RuntimeException("Le résultat doit être complété avant d'être envoyé");
        }

        if (result.getPatientEmail() == null || result.getPatientEmail().isEmpty()) {
            throw new RuntimeException("L'email du patient est requis pour l'envoi");
        }

        // Générer et sauvegarder le code d'accès
        String accessCode = generateAccessCode();
        result.setAccessCodeHash(passwordEncoder.encode(accessCode));
        result.setStatus(ResultStatus.SENT);
        result.setSentAt(LocalDateTime.now());
        result.setAccessAttempts(0);

        result = patientResultRepository.save(result);

        // Envoyer les emails de manière asynchrone
        String patientName = getPatientFullName(result);
        emailService.sendResultNotification(
                result.getPatientEmail(),
                patientName,
                result.getId().toString(),
                result.getReferenceDossier()
        );

        emailService.sendAccessCode(
                result.getPatientEmail(),
                patientName,
                accessCode
        );

        log.info("Résultat envoyé: {} - Code d'accès généré", result.getId());

        return convertToResponse(result);
    }

    /**
     * Vérifie le code d'accès et retourne le résultat
     */
    @Transactional
    public Map<String, Object> verifyAccessCodeAndGetResult(
            UUID resultId,
            VerifyAccessCodeRequest request,
            String ipAddress,
            String userAgent
    ) {
        log.info("Vérification du code d'accès pour le résultat: {}", resultId);

        PatientResult result = patientResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé"));

        // Vérifier le nombre de tentatives
        if (result.getAccessAttempts() >= maxAccessAttempts) {
            log.warn("Nombre maximum de tentatives atteint pour le résultat: {}", resultId);
            throw new RuntimeException("Nombre maximum de tentatives atteint. Veuillez contacter le laboratoire.");
        }

        // Vérifier le code
        boolean isValid = passwordEncoder.matches(request.getAccessCode(), result.getAccessCodeHash());

        // Logger la tentative
        AccessLog accessLog = AccessLog.builder()
                .patientResult(result)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .accessSuccessful(isValid)
                .build();
        accessLogRepository.save(accessLog);

        if (!isValid) {
            // Incrémenter le compteur de tentatives
            result.setAccessAttempts(result.getAccessAttempts() + 1);
            patientResultRepository.save(result);
            
            log.warn("Code d'accès invalide pour le résultat: {}", resultId);
            throw new RuntimeException("Code d'accès invalide");
        }

        // Mettre à jour le statut si première consultation
        if (result.getStatus() != ResultStatus.OPENED) {
            result.setStatus(ResultStatus.OPENED);
            result.setOpenedAt(LocalDateTime.now());
        }
        
        result.setAccessAttempts(0); // Réinitialiser les tentatives
        patientResultRepository.save(result);

        log.info("Code d'accès valide - Accès accordé au résultat: {}", resultId);

        // Retourner les informations du résultat
        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("result", convertToResponse(result));
        
        return response;
    }

    /**
     * Récupère le PDF d'un résultat
     * Les PDFs sont stockés CHIFFRÉS en base - ils sont DÉCHIFFRÉS à la lecture
     * Gère aussi les PDFs legacy non chiffrés
     */
    @Transactional(readOnly = true)
    public byte[] getResultPdf(UUID resultId) throws IOException {
        PatientResult result = patientResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé"));

        // Priorité 1: PDF stocké en base de données
        if (result.getPdfContent() != null && result.getPdfContent().length > 0) {
            byte[] storedContent = result.getPdfContent();
            
            // Utiliser decryptSafe qui gère automatiquement les cas chiffrés et non chiffrés
            log.debug("PDF récupéré depuis PostgreSQL ({} octets)", storedContent.length);
            byte[] pdfContent = encryptionService.decryptSafe(storedContent);
            log.debug("PDF prêt: {} Ko", pdfContent.length / 1024);
            return pdfContent;
        }
        
        // Fallback: lecture depuis le disque (pour les anciens enregistrements)
        if (result.getPdfFilePath() != null) {
            log.info("PDF non trouvé en base, lecture depuis: {}", result.getPdfFilePath());
            return fileService.readFile(result.getPdfFilePath());
        }
        
        throw new RuntimeException("PDF non disponible pour ce résultat");
    }

    /**
     * Récupère tous les résultats avec pagination et filtres
     */
    @Transactional(readOnly = true)
    public Page<PatientResultResponse> getAllResults(
            ResultStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<PatientResult> results;

        if (search != null && !search.isEmpty()) {
            results = patientResultRepository.searchResults(search, pageable);
        } else if (status != null && startDate == null && endDate == null) {
            results = patientResultRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (status == null && startDate == null && endDate == null) {
            results = patientResultRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
            LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
            results = patientResultRepository.findByFilters(status, startDateTime, endDateTime, pageable);
        }

        return results.map(this::convertToResponse);
    }

    /**
     * Récupère un résultat par son ID
     */
    @Transactional(readOnly = true)
    public PatientResultResponse getResultById(UUID id) {
        PatientResult result = patientResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé avec l'ID: " + id));
        return convertToResponse(result);
    }

    /**
     * Supprime un résultat
     */
    @Transactional
    public void deleteResult(UUID id) {
        log.info("Suppression du résultat: {}", id);

        PatientResult result = patientResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé avec l'ID: " + id));

        try {
            // Supprimer le fichier PDF (ignorer l'erreur si le fichier n'existe pas)
            if (result.getPdfFilePath() != null) {
                fileService.deleteFile(result.getPdfFilePath());
            }
        } catch (Exception e) {
            log.warn("Impossible de supprimer le fichier PDF: {} - {}", result.getPdfFilePath(), e.getMessage());
            // Continuer même si le fichier n'existe pas
        }

        // Supprimer les logs d'accès
        try {
            accessLogRepository.deleteAll(accessLogRepository.findByPatientResult(result));
        } catch (Exception e) {
            log.warn("Erreur lors de la suppression des logs d'accès: {}", e.getMessage());
        }

        // Supprimer le résultat
        patientResultRepository.delete(result);

        log.info("Résultat supprimé: {}", id);
    }

    /**
     * Récupère les statistiques pour le dashboard (semaine actuelle)
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        return getDashboardStats(0);
    }

    /**
     * Récupère les statistiques pour le dashboard avec offset de semaine
     * @param weekOffset 0 = semaine actuelle, 1 = semaine précédente, etc.
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(int weekOffset) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        
        Long totalResults = patientResultRepository.count();
        Long resultsSentToday = patientResultRepository.countSentSince(startOfToday);
        Long resultsAwaitingCompletion = patientResultRepository.countByStatus(ResultStatus.IMPORTED);
        
        // Calculer le taux d'ouverture
        Long totalSent = patientResultRepository.countByStatus(ResultStatus.SENT) +
                        patientResultRepository.countByStatus(ResultStatus.OPENED);
        Long totalOpened = patientResultRepository.countByStatus(ResultStatus.OPENED);
        Double openRate = totalSent > 0 ? (totalOpened.doubleValue() / totalSent.doubleValue()) * 100 : 0.0;

        // Distribution par statut
        Map<String, Long> statusDistribution = new HashMap<>();
        for (ResultStatus status : ResultStatus.values()) {
            Long count = patientResultRepository.countByStatus(status);
            statusDistribution.put(status.name(), count);
        }

        // Statistiques hebdomadaires avec l'offset de semaine
        List<DashboardStatsResponse.DailyStats> weeklyStats = calculateWeeklyStats(weekOffset);

        // Calculer les dates de début et fin de la période
        LocalDate today = LocalDate.now();
        LocalDate periodEnd = today.minusDays(weekOffset * 7L);
        LocalDate periodStart = periodEnd.minusDays(6);

        return DashboardStatsResponse.builder()
                .totalResults(totalResults)
                .resultsSentToday(resultsSentToday)
                .resultsAwaitingCompletion(resultsAwaitingCompletion)
                .openRate(openRate)
                .statusDistribution(statusDistribution)
                .weeklyStats(weeklyStats)
                .weekOffset(weekOffset)
                .periodStart(periodStart.toString())
                .periodEnd(periodEnd.toString())
                .build();
    }

    /**
     * Calcule les statistiques pour une semaine donnée
     * @param weekOffset 0 = semaine actuelle, 1 = semaine précédente, etc.
     */
    private List<DashboardStatsResponse.DailyStats> calculateWeeklyStats(int weekOffset) {
        List<DashboardStatsResponse.DailyStats> stats = new ArrayList<>();
        String[] dayNames = {"Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"};
        
        LocalDate today = LocalDate.now();
        // Décaler de weekOffset semaines (7 jours par semaine)
        LocalDate referenceDate = today.minusDays(weekOffset * 7L);
        
        for (int i = 6; i >= 0; i--) {
            LocalDate date = referenceDate.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            
            Long importedCount = patientResultRepository.countCreatedBetween(startOfDay, endOfDay);
            Long sentCount = patientResultRepository.countSentBetween(startOfDay, endOfDay);
            Long openedCount = patientResultRepository.countOpenedBetween(startOfDay, endOfDay);
            
            // Calculer le taux d'ouverture du jour
            Double dailyOpenRate = sentCount > 0 ? (openedCount.doubleValue() / sentCount.doubleValue()) * 100 : 0.0;
            
            String dayLabel = dayNames[date.getDayOfWeek().getValue() % 7] + " " + date.getDayOfMonth();
            
            stats.add(DashboardStatsResponse.DailyStats.builder()
                    .date(date.toString())
                    .dayLabel(dayLabel)
                    .importedCount(importedCount)
                    .sentCount(sentCount)
                    .openRate(dailyOpenRate)
                    .build());
        }
        
        return stats;
    }

    /**
     * Récupère les résultats récents
     */
    @Transactional(readOnly = true)
    public List<PatientResultResponse> getRecentResults(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return patientResultRepository.findRecentResults(pageable).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Marque un résultat comme ouvert/consulté
     * Appelé après vérification OTP WhatsApp
     */
    @Transactional
    public void markAsOpened(UUID resultId, String ipAddress, String userAgent) {
        PatientResult result = patientResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé"));
        
        if (result.getStatus() != ResultStatus.OPENED) {
            result.setStatus(ResultStatus.OPENED);
            result.setOpenedAt(LocalDateTime.now());
            patientResultRepository.save(result);
            
            // Logger l'accès
            accessLogRepository.save(AccessLog.builder()
                    .patientResult(result)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .accessedAt(LocalDateTime.now())
                    .accessType("OTP_WHATSAPP")
                    .build());
            
            log.info("Résultat {} marqué comme ouvert (via WhatsApp OTP)", resultId);
        }
    }

    /**
     * Génère un code d'accès aléatoire
     */
    private String generateAccessCode() {
        StringBuilder code = new StringBuilder(accessCodeLength);
        for (int i = 0; i < accessCodeLength; i++) {
            code.append(ACCESS_CODE_CHARS.charAt(random.nextInt(ACCESS_CODE_CHARS.length())));
        }
        return code.toString();
    }

    /**
     * Récupère le nom complet du patient
     */
    private String getPatientFullName(PatientResult result) {
        String firstName = result.getPatientFirstName() != null ? result.getPatientFirstName() : "";
        String lastName = result.getPatientLastName() != null ? result.getPatientLastName() : "";
        return (firstName + " " + lastName).trim();
    }

    /**
     * Convertit une entité PatientResult en PatientResultResponse
     */
    private PatientResultResponse convertToResponse(PatientResult result) {
        String importedByName = result.getImportedBy() != null ?
                result.getImportedBy().getFirstName() + " " + result.getImportedBy().getLastName() : null;

        return PatientResultResponse.builder()
                .id(result.getId())
                .referenceDossier(result.getReferenceDossier())
                .patientFirstName(result.getPatientFirstName())
                .patientLastName(result.getPatientLastName())
                .patientBirthdate(result.getPatientBirthdate())
                .patientEmail(result.getPatientEmail())
                .patientPhone(result.getPatientPhone())
                .pdfFileName(result.getPdfFileName())
                .status(result.getStatus())
                .importMethod(result.getImportMethod())
                .importedAt(result.getImportedAt())
                .sentAt(result.getSentAt())
                .openedAt(result.getOpenedAt())
                .importedByName(importedByName)
                .createdAt(result.getCreatedAt())
                .updatedAt(result.getUpdatedAt())
                .build();
    }
}
