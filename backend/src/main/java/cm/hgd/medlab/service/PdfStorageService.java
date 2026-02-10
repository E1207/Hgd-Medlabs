package cm.hgd.medlab.service;

import cm.hgd.medlab.dto.PdfMetadata;
import cm.hgd.medlab.model.entity.PatientResult;
import cm.hgd.medlab.repository.PatientResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Optional;
import java.util.UUID;

/**
 * Service de stockage des PDFs dans PostgreSQL
 * 
 * Cette approche offre plusieurs avantages pour un environnement hospitalier:
 * - Sécurité: Les données sont dans la base, pas sur le système de fichiers
 * - Intégrité: Transactions ACID garantissent la cohérence
 * - Sauvegarde: Un seul pg_dump sauvegarde tout (métadonnées + PDFs)
 * - Simplicité: Pas de gestion de chemins de fichiers
 * - Portabilité: Fonctionne sur tout serveur avec PostgreSQL
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfStorageService {

    private final PatientResultRepository patientResultRepository;
    private final FileService fileService; // Pour l'extraction des métadonnées

    /**
     * Stocke un PDF uploadé directement dans PostgreSQL
     * 
     * @param file Le fichier PDF uploadé
     * @return Les métadonnées extraites du PDF
     */
    public PdfStorageResult storeUploadedPdf(MultipartFile file) throws IOException {
        log.info("Stockage du PDF dans PostgreSQL: {}", file.getOriginalFilename());
        
        byte[] pdfContent = file.getBytes();
        String fileName = file.getOriginalFilename();
        long fileSize = file.getSize();
        
        // Extraire les métadonnées
        PdfMetadata metadata = extractMetadataFromBytes(pdfContent);
        
        log.info("PDF prêt pour stockage: {} ({} Ko)", fileName, fileSize / 1024);
        
        return PdfStorageResult.builder()
                .pdfContent(pdfContent)
                .fileName(fileName)
                .fileSize(fileSize)
                .contentType("application/pdf")
                .metadata(metadata)
                .build();
    }

    /**
     * Stocke un PDF depuis un fichier sur disque (import automatique)
     */
    public PdfStorageResult storeFileFromDisk(File file) throws IOException {
        log.info("Lecture du PDF depuis le disque: {}", file.getAbsolutePath());
        
        byte[] pdfContent = Files.readAllBytes(file.toPath());
        String fileName = file.getName();
        long fileSize = file.length();
        
        // Extraire les métadonnées
        PdfMetadata metadata = extractMetadataFromBytes(pdfContent);
        
        log.info("PDF lu depuis disque: {} ({} Ko)", fileName, fileSize / 1024);
        
        return PdfStorageResult.builder()
                .pdfContent(pdfContent)
                .fileName(fileName)
                .fileSize(fileSize)
                .contentType("application/pdf")
                .metadata(metadata)
                .build();
    }

    /**
     * Récupère le contenu PDF d'un résultat patient
     */
    @Transactional(readOnly = true)
    public Optional<byte[]> getPdfContent(UUID resultId) {
        log.debug("Récupération du PDF pour le résultat: {}", resultId);
        
        return patientResultRepository.findById(resultId)
                .map(result -> {
                    if (result.getPdfContent() != null) {
                        log.debug("PDF trouvé dans la base ({} Ko)", 
                                result.getPdfContent().length / 1024);
                        return result.getPdfContent();
                    }
                    
                    // Fallback: essayer de lire depuis le chemin legacy
                    if (result.getPdfFilePath() != null) {
                        try {
                            log.info("PDF non trouvé en base, lecture depuis le disque: {}", 
                                    result.getPdfFilePath());
                            return Files.readAllBytes(new File(result.getPdfFilePath()).toPath());
                        } catch (IOException e) {
                            log.error("Erreur lecture PDF depuis disque: {}", e.getMessage());
                        }
                    }
                    
                    return null;
                });
    }

    /**
     * Récupère le contenu PDF par référence dossier (pour accès public)
     */
    @Transactional(readOnly = true)
    public Optional<byte[]> getPdfContentByReference(String referenceDossier) {
        log.debug("Récupération du PDF pour la référence: {}", referenceDossier);
        
        return patientResultRepository.findByReferenceDossier(referenceDossier)
                .map(result -> {
                    if (result.getPdfContent() != null) {
                        return result.getPdfContent();
                    }
                    
                    // Fallback legacy
                    if (result.getPdfFilePath() != null) {
                        try {
                            return Files.readAllBytes(new File(result.getPdfFilePath()).toPath());
                        } catch (IOException e) {
                            log.error("Erreur lecture PDF: {}", e.getMessage());
                        }
                    }
                    
                    return null;
                });
    }

    /**
     * Migre les anciens PDFs stockés sur disque vers PostgreSQL
     * Utile pour la migration des données existantes
     */
    @Transactional
    public MigrationResult migrateFilesToDatabase() {
        log.info("Début de la migration des PDFs vers PostgreSQL...");
        
        MigrationResult result = new MigrationResult();
        
        patientResultRepository.findAll().forEach(patient -> {
            result.totalProcessed++;
            
            // Si déjà migré, skip
            if (patient.getPdfContent() != null && patient.getPdfContent().length > 0) {
                result.alreadyMigrated++;
                return;
            }
            
            // Si pas de chemin fichier, skip
            if (patient.getPdfFilePath() == null || patient.getPdfFilePath().isEmpty()) {
                result.noFilePath++;
                return;
            }
            
            try {
                File file = new File(patient.getPdfFilePath());
                if (file.exists()) {
                    byte[] content = Files.readAllBytes(file.toPath());
                    patient.setPdfContent(content);
                    patient.setPdfFileSize((long) content.length);
                    patient.setPdfContentType("application/pdf");
                    patientResultRepository.save(patient);
                    result.migrated++;
                    log.debug("Migré: {} ({} Ko)", patient.getReferenceDossier(), content.length / 1024);
                } else {
                    result.fileNotFound++;
                    log.warn("Fichier non trouvé: {}", patient.getPdfFilePath());
                }
            } catch (IOException e) {
                result.errors++;
                log.error("Erreur migration {}: {}", patient.getReferenceDossier(), e.getMessage());
            }
        });
        
        log.info("Migration terminée: {} migrés, {} déjà faits, {} erreurs", 
                result.migrated, result.alreadyMigrated, result.errors);
        
        return result;
    }

    /**
     * Calcule l'espace total utilisé par les PDFs dans PostgreSQL
     */
    @Transactional(readOnly = true)
    public StorageInfo getStorageInfo() {
        StorageInfo info = new StorageInfo();
        
        patientResultRepository.findAll().forEach(result -> {
            info.totalDocuments++;
            if (result.getPdfContent() != null) {
                info.totalSizeBytes += result.getPdfContent().length;
                info.documentsInDatabase++;
            } else if (result.getPdfFilePath() != null) {
                info.documentsOnDisk++;
            }
        });
        
        return info;
    }

    /**
     * Extrait les métadonnées d'un PDF à partir de son contenu binaire
     */
    private PdfMetadata extractMetadataFromBytes(byte[] pdfContent) {
        try (PDDocument document = Loader.loadPDF(pdfContent)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(1);
            String text = stripper.getText(document);
            
            // Utiliser la logique existante de FileService via réflexion 
            // ou dupliquer la logique ici
            return fileService.extractMetadataFromMultipart(
                    new ByteArrayMultipartFile(pdfContent, "temp.pdf", "application/pdf"));
        } catch (IOException e) {
            log.error("Erreur extraction métadonnées: {}", e.getMessage());
            return PdfMetadata.builder().build();
        }
    }

    // ==================== Classes internes ====================

    @lombok.Builder
    @lombok.Data
    public static class PdfStorageResult {
        private byte[] pdfContent;
        private String fileName;
        private long fileSize;
        private String contentType;
        private PdfMetadata metadata;
    }

    @lombok.Data
    public static class MigrationResult {
        private int totalProcessed = 0;
        private int migrated = 0;
        private int alreadyMigrated = 0;
        private int fileNotFound = 0;
        private int noFilePath = 0;
        private int errors = 0;
    }

    @lombok.Data
    public static class StorageInfo {
        private long totalDocuments = 0;
        private long documentsInDatabase = 0;
        private long documentsOnDisk = 0;
        private long totalSizeBytes = 0;
        
        public long getTotalSizeMB() {
            return totalSizeBytes / (1024 * 1024);
        }
    }

    /**
     * Implémentation simple de MultipartFile pour les bytes
     */
    private static class ByteArrayMultipartFile implements MultipartFile {
        private final byte[] content;
        private final String name;
        private final String contentType;

        public ByteArrayMultipartFile(byte[] content, String name, String contentType) {
            this.content = content;
            this.name = name;
            this.contentType = contentType;
        }

        @Override
        public String getName() { return name; }

        @Override
        public String getOriginalFilename() { return name; }

        @Override
        public String getContentType() { return contentType; }

        @Override
        public boolean isEmpty() { return content == null || content.length == 0; }

        @Override
        public long getSize() { return content.length; }

        @Override
        public byte[] getBytes() { return content; }

        @Override
        public java.io.InputStream getInputStream() {
            return new ByteArrayInputStream(content);
        }

        @Override
        public void transferTo(File dest) throws IOException {
            Files.write(dest.toPath(), content);
        }
    }
}
