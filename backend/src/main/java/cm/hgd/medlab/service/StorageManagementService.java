package cm.hgd.medlab.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service de gestion du stockage local des fichiers PDF
 * Conforme aux exigences de l'Hôpital Général de Douala
 * 
 * Fonctionnalités:
 * - Organisation des fichiers par année/mois
 * - Archivage automatique des anciens fichiers
 * - Calcul de l'espace disque utilisé
 * - Logs d'audit pour traçabilité
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageManagementService {

    @Value("${medlab.file.upload-dir}")
    private String uploadDir;

    @Value("${medlab.file.watch-dir}")
    private String watchDir;

    @Value("${medlab.storage.archive-dir:#{null}}")
    private String archiveDir;

    @Value("${medlab.storage.backup-dir:#{null}}")
    private String backupDir;

    @Value("${medlab.storage.retention-days-active:365}")
    private int retentionDaysActive;

    @Value("${medlab.storage.archive-enabled:false}")
    private boolean archiveEnabled;

    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM");
    private static final DateTimeFormatter BACKUP_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /**
     * Génère le chemin de stockage organisé par année/mois
     * Ex: /var/medlab/data/uploads/2026/02/fichier.pdf
     */
    public Path getOrganizedStoragePath(String baseDir, String fileName) throws IOException {
        LocalDate now = LocalDate.now();
        String yearMonth = now.format(YEAR_MONTH_FORMAT);
        
        Path organizedPath = Paths.get(baseDir, yearMonth);
        if (!Files.exists(organizedPath)) {
            Files.createDirectories(organizedPath);
            log.info("Répertoire créé: {}", organizedPath);
        }
        
        return organizedPath.resolve(fileName);
    }

    /**
     * Calcule l'espace disque total utilisé par les fichiers stockés
     */
    public StorageStats getStorageStatistics() {
        StorageStats stats = new StorageStats();
        
        try {
            // Espace utilisé par les uploads
            stats.setUploadsDirSize(calculateDirectorySize(Paths.get(uploadDir)));
            stats.setUploadsDirPath(uploadDir);
            
            // Espace utilisé par le répertoire surveillé
            stats.setWatchDirSize(calculateDirectorySize(Paths.get(watchDir)));
            stats.setWatchDirPath(watchDir);
            
            // Espace utilisé par les archives si configuré
            if (archiveDir != null && Files.exists(Paths.get(archiveDir))) {
                stats.setArchiveDirSize(calculateDirectorySize(Paths.get(archiveDir)));
                stats.setArchiveDirPath(archiveDir);
            }
            
            // Espace disque disponible
            File uploadDirFile = new File(uploadDir);
            if (uploadDirFile.exists()) {
                stats.setFreeSpace(uploadDirFile.getFreeSpace());
                stats.setTotalSpace(uploadDirFile.getTotalSpace());
                stats.setUsableSpace(uploadDirFile.getUsableSpace());
            }
            
            // Compter les fichiers
            stats.setTotalFiles(countFiles(Paths.get(uploadDir)));
            
            log.info("Statistiques de stockage: {} fichiers, {} Mo utilisés, {} Go disponibles",
                    stats.getTotalFiles(),
                    stats.getTotalUsedMB(),
                    stats.getFreeSpaceGB());
                    
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques de stockage", e);
        }
        
        return stats;
    }

    /**
     * Calcule la taille d'un répertoire en octets
     */
    private long calculateDirectorySize(Path path) throws IOException {
        if (!Files.exists(path)) {
            return 0;
        }
        
        AtomicLong size = new AtomicLong(0);
        Files.walkFileTree(path, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                size.addAndGet(attrs.size());
                return FileVisitResult.CONTINUE;
            }
            
            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) {
                log.warn("Impossible d'accéder au fichier: {}", file);
                return FileVisitResult.CONTINUE;
            }
        });
        
        return size.get();
    }

    /**
     * Compte le nombre de fichiers dans un répertoire
     */
    private long countFiles(Path path) throws IOException {
        if (!Files.exists(path)) {
            return 0;
        }
        
        AtomicLong count = new AtomicLong(0);
        Files.walkFileTree(path, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (file.toString().toLowerCase().endsWith(".pdf")) {
                    count.incrementAndGet();
                }
                return FileVisitResult.CONTINUE;
            }
        });
        
        return count.get();
    }

    /**
     * Archive les fichiers plus anciens que la période de rétention active
     * Exécuté chaque nuit à 3h00
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void archiveOldFiles() {
        if (!archiveEnabled || archiveDir == null) {
            log.debug("Archivage désactivé");
            return;
        }
        
        log.info("Début de l'archivage des fichiers de plus de {} jours", retentionDaysActive);
        
        try {
            Path uploadPath = Paths.get(uploadDir);
            Path archivePath = Paths.get(archiveDir);
            
            if (!Files.exists(archivePath)) {
                Files.createDirectories(archivePath);
            }
            
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDaysActive);
            AtomicLong archivedCount = new AtomicLong(0);
            AtomicLong archivedSize = new AtomicLong(0);
            
            Files.walkFileTree(uploadPath, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    try {
                        LocalDateTime fileDate = LocalDateTime.ofInstant(
                                attrs.creationTime().toInstant(),
                                java.time.ZoneId.systemDefault()
                        );
                        
                        if (fileDate.isBefore(cutoffDate)) {
                            // Calculer le chemin relatif pour préserver la structure
                            Path relativePath = uploadPath.relativize(file);
                            Path targetPath = archivePath.resolve(relativePath);
                            
                            // Créer le répertoire parent si nécessaire
                            Files.createDirectories(targetPath.getParent());
                            
                            // Déplacer le fichier
                            Files.move(file, targetPath, StandardCopyOption.REPLACE_EXISTING);
                            
                            archivedCount.incrementAndGet();
                            archivedSize.addAndGet(attrs.size());
                            
                            log.debug("Fichier archivé: {} -> {}", file, targetPath);
                        }
                    } catch (IOException e) {
                        log.error("Erreur lors de l'archivage de {}", file, e);
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
            
            log.info("Archivage terminé: {} fichiers, {} Mo archivés",
                    archivedCount.get(),
                    archivedSize.get() / (1024 * 1024));
                    
        } catch (IOException e) {
            log.error("Erreur lors de l'archivage", e);
        }
    }

    /**
     * Vérifie l'intégrité des fichiers stockés
     */
    public IntegrityCheckResult checkStorageIntegrity() {
        IntegrityCheckResult result = new IntegrityCheckResult();
        
        try {
            Path uploadPath = Paths.get(uploadDir);
            
            Files.walkFileTree(uploadPath, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    result.incrementTotalFiles();
                    
                    // Vérifier que le fichier est lisible
                    if (!Files.isReadable(file)) {
                        result.addCorruptedFile(file.toString());
                        log.warn("Fichier non lisible: {}", file);
                    }
                    
                    // Vérifier la taille (fichier vide = suspect)
                    if (attrs.size() == 0) {
                        result.addEmptyFile(file.toString());
                        log.warn("Fichier vide détecté: {}", file);
                    }
                    
                    return FileVisitResult.CONTINUE;
                }
            });
            
            result.setSuccess(result.getCorruptedFiles().isEmpty());
            log.info("Vérification d'intégrité: {} fichiers vérifiés, {} problèmes détectés",
                    result.getTotalFiles(),
                    result.getCorruptedFiles().size() + result.getEmptyFiles().size());
                    
        } catch (IOException e) {
            log.error("Erreur lors de la vérification d'intégrité", e);
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
        }
        
        return result;
    }

    /**
     * Crée une sauvegarde du répertoire des uploads
     */
    public String createBackup() throws IOException {
        if (backupDir == null) {
            throw new IllegalStateException("Répertoire de backup non configuré");
        }
        
        Path backupPath = Paths.get(backupDir);
        if (!Files.exists(backupPath)) {
            Files.createDirectories(backupPath);
        }
        
        String backupName = "backup_" + LocalDateTime.now().format(BACKUP_FORMAT);
        Path targetBackupPath = backupPath.resolve(backupName);
        
        log.info("Création de la sauvegarde: {}", targetBackupPath);
        
        // Copier tous les fichiers
        Path sourcePath = Paths.get(uploadDir);
        Files.walkFileTree(sourcePath, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                Path targetDir = targetBackupPath.resolve(sourcePath.relativize(dir));
                Files.createDirectories(targetDir);
                return FileVisitResult.CONTINUE;
            }
            
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Path targetFile = targetBackupPath.resolve(sourcePath.relativize(file));
                Files.copy(file, targetFile, StandardCopyOption.REPLACE_EXISTING);
                return FileVisitResult.CONTINUE;
            }
        });
        
        log.info("Sauvegarde créée avec succès: {}", targetBackupPath);
        return targetBackupPath.toString();
    }

    // ==================== Classes internes ====================

    /**
     * Statistiques de stockage
     */
    public static class StorageStats {
        private long uploadsDirSize;
        private String uploadsDirPath;
        private long watchDirSize;
        private String watchDirPath;
        private long archiveDirSize;
        private String archiveDirPath;
        private long freeSpace;
        private long totalSpace;
        private long usableSpace;
        private long totalFiles;

        // Getters et Setters
        public long getUploadsDirSize() { return uploadsDirSize; }
        public void setUploadsDirSize(long uploadsDirSize) { this.uploadsDirSize = uploadsDirSize; }
        
        public String getUploadsDirPath() { return uploadsDirPath; }
        public void setUploadsDirPath(String uploadsDirPath) { this.uploadsDirPath = uploadsDirPath; }
        
        public long getWatchDirSize() { return watchDirSize; }
        public void setWatchDirSize(long watchDirSize) { this.watchDirSize = watchDirSize; }
        
        public String getWatchDirPath() { return watchDirPath; }
        public void setWatchDirPath(String watchDirPath) { this.watchDirPath = watchDirPath; }
        
        public long getArchiveDirSize() { return archiveDirSize; }
        public void setArchiveDirSize(long archiveDirSize) { this.archiveDirSize = archiveDirSize; }
        
        public String getArchiveDirPath() { return archiveDirPath; }
        public void setArchiveDirPath(String archiveDirPath) { this.archiveDirPath = archiveDirPath; }
        
        public long getFreeSpace() { return freeSpace; }
        public void setFreeSpace(long freeSpace) { this.freeSpace = freeSpace; }
        
        public long getTotalSpace() { return totalSpace; }
        public void setTotalSpace(long totalSpace) { this.totalSpace = totalSpace; }
        
        public long getUsableSpace() { return usableSpace; }
        public void setUsableSpace(long usableSpace) { this.usableSpace = usableSpace; }
        
        public long getTotalFiles() { return totalFiles; }
        public void setTotalFiles(long totalFiles) { this.totalFiles = totalFiles; }

        // Méthodes utilitaires
        public long getTotalUsedMB() {
            return (uploadsDirSize + watchDirSize + archiveDirSize) / (1024 * 1024);
        }
        
        public long getFreeSpaceGB() {
            return freeSpace / (1024 * 1024 * 1024);
        }
        
        public double getUsagePercentage() {
            if (totalSpace == 0) return 0;
            return ((double)(totalSpace - freeSpace) / totalSpace) * 100;
        }
    }

    /**
     * Résultat de vérification d'intégrité
     */
    public static class IntegrityCheckResult {
        private boolean success;
        private int totalFiles;
        private java.util.List<String> corruptedFiles = new java.util.ArrayList<>();
        private java.util.List<String> emptyFiles = new java.util.ArrayList<>();
        private String errorMessage;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public int getTotalFiles() { return totalFiles; }
        public void setTotalFiles(int totalFiles) { this.totalFiles = totalFiles; }
        public void incrementTotalFiles() { this.totalFiles++; }
        
        public java.util.List<String> getCorruptedFiles() { return corruptedFiles; }
        public void addCorruptedFile(String path) { this.corruptedFiles.add(path); }
        
        public java.util.List<String> getEmptyFiles() { return emptyFiles; }
        public void addEmptyFile(String path) { this.emptyFiles.add(path); }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}
