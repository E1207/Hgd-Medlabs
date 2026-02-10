package cm.hgd.medlab.service;

import cm.hgd.medlab.dto.PdfMetadata;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.Loader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service pour la gestion des fichiers PDF
 */
@Service
@Slf4j
public class FileService {

    @Value("${medlab.file.upload-dir}")
    private String uploadDir;

    @Value("${medlab.file.watch-dir}")
    private String watchDir;

    /**
     * Sauvegarde un fichier PDF uploadé
     */
    public String saveUploadedFile(MultipartFile file) throws IOException {
        log.info("Sauvegarde du fichier uploadé: {}", file.getOriginalFilename());

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = generateUniqueFileName(file.getOriginalFilename());
        Path filePath = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Fichier sauvegardé: {}", filePath);
        return filePath.toString();
    }

    /**
     * Sauvegarde un fichier depuis le répertoire surveillé
     */
    public String saveWatchedFile(File file) throws IOException {
        log.info("Traitement du fichier surveillé: {}", file.getName());

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = generateUniqueFileName(file.getName());
        Path targetPath = uploadPath.resolve(fileName);

        Files.copy(file.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Fichier copié: {}", targetPath);
        return targetPath.toString();
    }

    /**
     * Déplace un fichier vers le répertoire processed (dans le dossier source, pas le watch-dir fixe)
     */
    public void moveToProcessed(File file) throws IOException {
        Path parentDir = file.getParentFile().toPath();
        Path processedDir = parentDir.resolve("processed");
        if (!Files.exists(processedDir)) {
            Files.createDirectories(processedDir);
        }

        Path targetPath = processedDir.resolve(file.getName());
        Files.move(file.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Fichier déplacé vers processed: {}", targetPath);
    }

    /**
     * Déplace un fichier vers le répertoire error quand le traitement échoue
     */
    public void moveToError(File file) throws IOException {
        Path parentDir = file.getParentFile().toPath();
        Path errorDir = parentDir.resolve("error");
        if (!Files.exists(errorDir)) {
            Files.createDirectories(errorDir);
        }

        Path targetPath = errorDir.resolve(file.getName());
        Files.move(file.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Fichier déplacé vers error: {}", targetPath);
    }

    /**
     * Extrait les métadonnées d'un fichier PDF uploadé (MultipartFile)
     * Utilisé pour l'auto-fill du formulaire d'upload manuel
     */
    public PdfMetadata extractMetadataFromMultipart(MultipartFile file) throws IOException {
        log.info("Extraction des métadonnées du PDF uploadé: {}", file.getOriginalFilename());

        PdfMetadata metadata = PdfMetadata.builder().build();

        try (InputStream is = file.getInputStream();
             PDDocument document = Loader.loadPDF(is.readAllBytes())) {
            
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(1); // On ne lit que la première page
            String text = stripper.getText(document);

            log.info("Texte extrait de la page 1 du PDF:\n{}", text);

            return parseHgdPdfText(text);

        } catch (IOException e) {
            log.error("Erreur lors de l'extraction des métadonnées du PDF", e);
            return metadata;
        }
    }

    /**
     * Extrait les métadonnées d'un fichier PDF sur disque
     * Utilisé pour l'import automatique via le cron/scheduler
     */
    public PdfMetadata extractMetadata(String filePath) {
        log.info("Extraction des métadonnées du PDF: {}", filePath);

        PdfMetadata metadata = PdfMetadata.builder().build();

        try (PDDocument document = Loader.loadPDF(new File(filePath))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(1);
            String text = stripper.getText(document);

            log.info("Texte extrait de la page 1 du PDF:\n{}", text);

            return parseHgdPdfText(text);

        } catch (IOException e) {
            log.error("Erreur lors de l'extraction des métadonnées du PDF", e);
        }

        return metadata;
    }

    /**
     * Parse le texte extrait d'un PDF HGD pour en extraire les métadonnées patient.
     * 
     * Format attendu (Hôpital Général de Douala):
     *   Référence : 2601122170
     *   Mme TANKEU YOPA / M. NOM PRENOM
     *   Code Patient  2601122170
     * 
     * La référence = le Code Patient
     * Le nom = ce qui suit Mme/M./Mr (civilité)
     */
    private PdfMetadata parseHgdPdfText(String text) {
        PdfMetadata metadata = PdfMetadata.builder().build();

        log.debug("Parsing du texte PDF HGD...");

        // ===== 1. Extraire le Code Patient (= référence dossier) =====
        // Chercher "Code Patient  XXXXXXXXXX" ou "Code Patient: XXXXXXXXXX"
        Pattern codePatientPattern = Pattern.compile(
            "Code\\s+Patient\\s*:?\\s*([A-Z0-9-]+)", 
            Pattern.CASE_INSENSITIVE
        );
        Matcher codePatientMatcher = codePatientPattern.matcher(text);
        if (codePatientMatcher.find()) {
            metadata.setReferenceDossier(codePatientMatcher.group(1).trim());
            log.info("Code Patient (référence) trouvé: {}", metadata.getReferenceDossier());
        }

        // Si pas de Code Patient, essayer "Référence : XXXX"
        if (metadata.getReferenceDossier() == null || metadata.getReferenceDossier().isEmpty()) {
            Pattern refPattern = Pattern.compile(
                "R[ée]f[ée]rence\\s*:?\\s*([A-Z0-9-]+)",
                Pattern.CASE_INSENSITIVE
            );
            Matcher refMatcher = refPattern.matcher(text);
            if (refMatcher.find()) {
                metadata.setReferenceDossier(refMatcher.group(1).trim());
                log.info("Référence trouvée: {}", metadata.getReferenceDossier());
            }
        }

        // ===== 2. Extraire le nom du patient (dans le cadre: Mme/M./Mr NOM PRENOM) =====
        // Le format est: "Mme TANKEU YOPA" ou "M. NOM PRENOM" ou "Mr NOM PRENOM"
        // Cette ligne est juste avant "Code Patient"
        Pattern patientNamePattern = Pattern.compile(
            "(?:Mme|Mlle|M\\.|Mr|Monsieur|Madame)\\s+([A-ZÀ-ÿ][A-ZÀ-ÿ\\s-]+?)\\s*(?:\\n|Code\\s+Patient|$)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
        );
        Matcher patientNameMatcher = patientNamePattern.matcher(text);
        if (patientNameMatcher.find()) {
            String fullName = patientNameMatcher.group(1).trim();
            log.info("Nom complet du patient trouvé: {}", fullName);

            // Séparer nom et prénom - convention: le premier mot est le NOM, le reste est PRENOM
            // Exemple: "TANKEU YOPA" -> lastName=TANKEU, firstName=YOPA
            String[] nameParts = fullName.split("\\s+", 2);
            if (nameParts.length >= 2) {
                metadata.setLastName(nameParts[0].trim());
                metadata.setFirstName(nameParts[1].trim());
            } else {
                metadata.setLastName(fullName);
            }
            log.info("Nom: {}, Prénom: {}", metadata.getLastName(), metadata.getFirstName());
        }

        // ===== 3. Extraire la date de prélèvement =====
        Pattern datePattern = Pattern.compile(
            "Pr[ée]l[èe]vement\\s+du\\s*:?\\s*(\\d{2}[-/]\\d{2}[-/]\\d{4})",
            Pattern.CASE_INSENSITIVE
        );
        Matcher dateMatcher = datePattern.matcher(text);
        if (dateMatcher.find()) {
            String dateStr = dateMatcher.group(1).trim();
            log.info("Date de prélèvement trouvée: {}", dateStr);
            // On ne stocke pas la date de prélèvement comme date de naissance
            // mais c'est utile pour le contexte
        }

        // ===== 4. Extraire la date de naissance (si présente) =====
        Pattern birthdatePattern = Pattern.compile(
            "(?:Date\\s+de\\s+naissance|N[ée]\\(?e?\\)?\\s+le|DOB|Birthdate)\\s*:?\\s*(\\d{2}[/-]\\d{2}[/-]\\d{4}|\\d{4}[/-]\\d{2}[/-]\\d{2})",
            Pattern.CASE_INSENSITIVE
        );
        Matcher birthdateMatcher = birthdatePattern.matcher(text);
        if (birthdateMatcher.find()) {
            String dateStr = birthdateMatcher.group(1).trim();
            metadata.setBirthdate(parseDate(dateStr));
            log.info("Date de naissance trouvée: {}", metadata.getBirthdate());
        }

        // ===== 5. Extraire l'email (si présent, mais exclure ceux du labo) =====
        Pattern emailPattern = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}"
        );
        Matcher emailMatcher = emailPattern.matcher(text);
        while (emailMatcher.find()) {
            String email = emailMatcher.group().trim().toLowerCase();
            // Exclure les emails du laboratoire/hôpital
            if (!email.contains("hgd.cm") && !email.contains("laboratoire")) {
                metadata.setEmail(email);
                log.info("Email patient trouvé: {}", metadata.getEmail());
                break;
            }
        }

        // ===== 6. Extraire le téléphone (format camerounais) =====
        Pattern phonePattern = Pattern.compile(
            "(?:T[ée]l[ée]?phone|Tel|Phone|Contact|Mobile)\\s*:?\\s*(\\+237\\s?[0-9\\s]{9,12}|6[0-9\\s]{8,11})",
            Pattern.CASE_INSENSITIVE
        );
        Matcher phoneMatcher = phonePattern.matcher(text);
        if (phoneMatcher.find()) {
            String phone = phoneMatcher.group(1).replaceAll("\\s", "").trim();
            if (!phone.startsWith("+237")) {
                phone = "+237" + phone;
            }
            metadata.setPhone(phone);
            log.info("Téléphone trouvé: {}", metadata.getPhone());
        }

        return metadata;
    }

    /**
     * Lit le contenu d'un fichier PDF
     */
    public byte[] readFile(String filePath) throws IOException {
        return Files.readAllBytes(Paths.get(filePath));
    }

    /**
     * Supprime un fichier
     */
    public void deleteFile(String filePath) throws IOException {
        Files.deleteIfExists(Paths.get(filePath));
        log.info("Fichier supprimé: {}", filePath);
    }

    /**
     * Génère un nom de fichier unique
     */
    private String generateUniqueFileName(String originalFilename) {
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        return UUID.randomUUID().toString() + extension;
    }

    /**
     * Parse une date depuis différents formats
     */
    private LocalDate parseDate(String dateStr) {
        // Remplacer les tirets par des slash pour uniformiser
        String normalized = dateStr.replace("-", "/");
        
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy")
        };

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(normalized, formatter);
            } catch (Exception ignored) {
            }
        }

        log.warn("Impossible de parser la date: {}", dateStr);
        return null;
    }

    /**
     * Initialise les répertoires nécessaires
     */
    public void initializeDirectories() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            Files.createDirectories(Paths.get(watchDir));
            Files.createDirectories(Paths.get(watchDir, "processed"));
            Files.createDirectories(Paths.get(watchDir, "error"));
            log.info("Répertoires initialisés: upload={}, watch={}", uploadDir, watchDir);
        } catch (IOException e) {
            log.error("Erreur lors de l'initialisation des répertoires", e);
        }
    }

    public String getWatchDir() {
        return watchDir;
    }

    public void setWatchDir(String watchDir) {
        this.watchDir = watchDir;
    }
}
