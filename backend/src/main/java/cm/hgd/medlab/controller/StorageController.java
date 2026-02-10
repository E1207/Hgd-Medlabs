package cm.hgd.medlab.controller;

import cm.hgd.medlab.service.PdfStorageService;
import cm.hgd.medlab.service.StorageManagementService;
import cm.hgd.medlab.service.StorageManagementService.IntegrityCheckResult;
import cm.hgd.medlab.service.StorageManagementService.StorageStats;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

/**
 * Contrôleur pour la gestion du stockage local
 * Accessible uniquement aux administrateurs
 */
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Storage", description = "Gestion du stockage local des fichiers")
@SecurityRequirement(name = "bearerAuth")
public class StorageController {

    private final StorageManagementService storageService;
    private final PdfStorageService pdfStorageService;

    /**
     * Récupère les statistiques de stockage
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Statistiques de stockage", description = "Retourne les statistiques d'utilisation du stockage local")
    public ResponseEntity<StorageStatsResponse> getStorageStats() {
        log.info("Récupération des statistiques de stockage");
        
        StorageStats stats = storageService.getStorageStatistics();
        
        StorageStatsResponse response = new StorageStatsResponse();
        response.setUploadsDirPath(stats.getUploadsDirPath());
        response.setUploadsDirSizeMB(stats.getUploadsDirSize() / (1024 * 1024));
        response.setWatchDirPath(stats.getWatchDirPath());
        response.setWatchDirSizeMB(stats.getWatchDirSize() / (1024 * 1024));
        response.setArchiveDirPath(stats.getArchiveDirPath());
        response.setArchiveDirSizeMB(stats.getArchiveDirSize() / (1024 * 1024));
        response.setTotalUsedMB(stats.getTotalUsedMB());
        response.setFreeSpaceGB(stats.getFreeSpaceGB());
        response.setTotalSpaceGB(stats.getTotalSpace() / (1024 * 1024 * 1024));
        response.setUsagePercentage(Math.round(stats.getUsagePercentage() * 100.0) / 100.0);
        response.setTotalFiles(stats.getTotalFiles());
        
        // Alertes
        if (stats.getUsagePercentage() > 90) {
            response.setAlertLevel("CRITICAL");
            response.setAlertMessage("Espace disque critique! Moins de 10% disponible.");
        } else if (stats.getUsagePercentage() > 80) {
            response.setAlertLevel("WARNING");
            response.setAlertMessage("Espace disque faible. Moins de 20% disponible.");
        } else {
            response.setAlertLevel("OK");
            response.setAlertMessage("Espace disque suffisant.");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Vérifie l'intégrité des fichiers stockés
     */
    @GetMapping("/integrity-check")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Vérification d'intégrité", description = "Vérifie l'intégrité des fichiers stockés")
    public ResponseEntity<IntegrityCheckResult> checkIntegrity() {
        log.info("Lancement de la vérification d'intégrité du stockage");
        
        IntegrityCheckResult result = storageService.checkStorageIntegrity();
        
        return ResponseEntity.ok(result);
    }

    /**
     * Crée une sauvegarde manuelle
     */
    @PostMapping("/backup")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer une sauvegarde", description = "Crée une sauvegarde des fichiers uploadés")
    public ResponseEntity<Map<String, String>> createBackup() {
        log.info("Création d'une sauvegarde manuelle");
        
        try {
            String backupPath = storageService.createBackup();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Sauvegarde créée avec succès",
                    "backupPath", backupPath
            ));
        } catch (IOException e) {
            log.error("Erreur lors de la création de la sauvegarde", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de la création de la sauvegarde: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Force l'archivage des anciens fichiers
     */
    @PostMapping("/archive")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Archiver les anciens fichiers", description = "Archive les fichiers plus anciens que la période de rétention")
    public ResponseEntity<Map<String, String>> triggerArchive() {
        log.info("Déclenchement manuel de l'archivage");
        
        try {
            storageService.archiveOldFiles();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Archivage terminé avec succès"
            ));
        } catch (Exception e) {
            log.error("Erreur lors de l'archivage", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de l'archivage: " + e.getMessage()
            ));
        }
    }

    /**
     * Statistiques du stockage PostgreSQL
     */
    @GetMapping("/database-stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Stats stockage PostgreSQL", description = "Statistiques des PDFs stockés dans la base de données")
    public ResponseEntity<PdfStorageService.StorageInfo> getDatabaseStorageStats() {
        log.info("Récupération des statistiques de stockage PostgreSQL");
        
        PdfStorageService.StorageInfo info = pdfStorageService.getStorageInfo();
        
        return ResponseEntity.ok(info);
    }

    /**
     * Migrer les PDFs du disque vers PostgreSQL
     */
    @PostMapping("/migrate-to-database")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Migrer vers PostgreSQL", description = "Migre tous les PDFs du disque vers la base de données PostgreSQL")
    public ResponseEntity<PdfStorageService.MigrationResult> migrateToDatabase() {
        log.info("Début de la migration des PDFs vers PostgreSQL");
        
        PdfStorageService.MigrationResult result = pdfStorageService.migrateFilesToDatabase();
        
        return ResponseEntity.ok(result);
    }

    // ==================== DTO Response ====================

    public static class StorageStatsResponse {
        private String uploadsDirPath;
        private long uploadsDirSizeMB;
        private String watchDirPath;
        private long watchDirSizeMB;
        private String archiveDirPath;
        private long archiveDirSizeMB;
        private long totalUsedMB;
        private long freeSpaceGB;
        private long totalSpaceGB;
        private double usagePercentage;
        private long totalFiles;
        private String alertLevel;
        private String alertMessage;

        // Getters et Setters
        public String getUploadsDirPath() { return uploadsDirPath; }
        public void setUploadsDirPath(String uploadsDirPath) { this.uploadsDirPath = uploadsDirPath; }
        
        public long getUploadsDirSizeMB() { return uploadsDirSizeMB; }
        public void setUploadsDirSizeMB(long uploadsDirSizeMB) { this.uploadsDirSizeMB = uploadsDirSizeMB; }
        
        public String getWatchDirPath() { return watchDirPath; }
        public void setWatchDirPath(String watchDirPath) { this.watchDirPath = watchDirPath; }
        
        public long getWatchDirSizeMB() { return watchDirSizeMB; }
        public void setWatchDirSizeMB(long watchDirSizeMB) { this.watchDirSizeMB = watchDirSizeMB; }
        
        public String getArchiveDirPath() { return archiveDirPath; }
        public void setArchiveDirPath(String archiveDirPath) { this.archiveDirPath = archiveDirPath; }
        
        public long getArchiveDirSizeMB() { return archiveDirSizeMB; }
        public void setArchiveDirSizeMB(long archiveDirSizeMB) { this.archiveDirSizeMB = archiveDirSizeMB; }
        
        public long getTotalUsedMB() { return totalUsedMB; }
        public void setTotalUsedMB(long totalUsedMB) { this.totalUsedMB = totalUsedMB; }
        
        public long getFreeSpaceGB() { return freeSpaceGB; }
        public void setFreeSpaceGB(long freeSpaceGB) { this.freeSpaceGB = freeSpaceGB; }
        
        public long getTotalSpaceGB() { return totalSpaceGB; }
        public void setTotalSpaceGB(long totalSpaceGB) { this.totalSpaceGB = totalSpaceGB; }
        
        public double getUsagePercentage() { return usagePercentage; }
        public void setUsagePercentage(double usagePercentage) { this.usagePercentage = usagePercentage; }
        
        public long getTotalFiles() { return totalFiles; }
        public void setTotalFiles(long totalFiles) { this.totalFiles = totalFiles; }
        
        public String getAlertLevel() { return alertLevel; }
        public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }
        
        public String getAlertMessage() { return alertMessage; }
        public void setAlertMessage(String alertMessage) { this.alertMessage = alertMessage; }
    }
}
