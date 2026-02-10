package cm.hgd.medlab.scheduler;

import cm.hgd.medlab.service.AppSettingService;
import cm.hgd.medlab.service.FileService;
import cm.hgd.medlab.service.PatientResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Scheduler intelligent pour l'import automatique des résultats PDF.
 * Surveille un répertoire configurable (via paramètres en BD ou application.yml)
 * et importe les nouveaux PDF automatiquement.
 * 
 * Fonctionnalités:
 * - Chemin du répertoire surveillé configurable depuis la BD (page Paramètres)
 * - Tri des fichiers par date de modification (plus anciens traités en premier)
 * - Gestion d'erreurs robuste avec déplacement des fichiers en erreur
 * - Verrouillage pour éviter les traitements concurrents
 * - Vérification de la stabilité du fichier (taille qui ne change plus)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FileWatcherScheduler {

    private final FileService fileService;
    private final PatientResultService patientResultService;
    private final AppSettingService appSettingService;

    @Value("${medlab.file.watch-dir}")
    private String defaultWatchDir;

    @Value("${medlab.scheduler.enabled}")
    private boolean schedulerEnabledConfig;

    private volatile boolean isProcessing = false;

    /**
     * Initialise les répertoires au démarrage de l'application
     * et insère les paramètres par défaut dans la BD si absents
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initializeOnStartup() {
        log.info("Initialisation des répertoires...");
        fileService.initializeDirectories();

        // Initialiser les paramètres par défaut dans la BD s'ils n'existent pas
        try {
            if (appSettingService.getSetting(AppSettingService.KEY_WATCH_DIR).isEmpty()) {
                appSettingService.saveSetting(
                    AppSettingService.KEY_WATCH_DIR,
                    defaultWatchDir,
                    "Chemin du répertoire surveillé pour l'import automatique des PDF"
                );
            }
            if (appSettingService.getSetting(AppSettingService.KEY_SCHEDULER_ENABLED).isEmpty()) {
                appSettingService.saveSetting(
                    AppSettingService.KEY_SCHEDULER_ENABLED,
                    String.valueOf(schedulerEnabledConfig),
                    "Activer/désactiver l'import automatique (true/false)"
                );
            }
            if (appSettingService.getSetting(AppSettingService.KEY_HOSPITAL_NAME).isEmpty()) {
                appSettingService.saveSetting(
                    AppSettingService.KEY_HOSPITAL_NAME,
                    "Hôpital Général de Douala",
                    "Nom de l'hôpital affiché dans l'application"
                );
            }
        } catch (Exception e) {
            log.warn("Impossible d'initialiser les paramètres par défaut (la table n'existe peut-être pas encore): {}", e.getMessage());
        }

        String watchDir = getEffectiveWatchDir();
        log.info("Répertoires initialisés - Surveillance: {}", watchDir);
    }

    /**
     * Surveille le répertoire et importe les nouveaux PDFs.
     * Le chemin du répertoire est lu depuis la BD à chaque exécution,
     * permettant de le changer à chaud depuis la page Paramètres.
     */
    @Scheduled(fixedDelayString = "${medlab.scheduler.fixed-delay}")
    public void scanAndImportNewFiles() {
        // Vérifier si le scheduler est activé (depuis la BD, fallback sur la config)
        boolean enabled;
        try {
            enabled = appSettingService.isSchedulerEnabled(schedulerEnabledConfig);
        } catch (Exception e) {
            enabled = schedulerEnabledConfig;
        }

        if (!enabled) {
            return;
        }

        // Éviter les traitements concurrents
        if (isProcessing) {
            log.debug("Traitement en cours, scan ignoré");
            return;
        }

        isProcessing = true;
        try {
            String watchDir = getEffectiveWatchDir();
            File watchDirectory = new File(watchDir);

            if (!watchDirectory.exists()) {
                log.warn("Le répertoire surveillé n'existe pas: {}. Tentative de création...", watchDir);
                try {
                    Files.createDirectories(watchDirectory.toPath());
                    Files.createDirectories(Paths.get(watchDir, "processed"));
                    Files.createDirectories(Paths.get(watchDir, "error"));
                } catch (IOException e) {
                    log.error("Impossible de créer le répertoire: {}", watchDir, e);
                    return;
                }
            }

            // Lister les fichiers PDF dans le répertoire
            File[] pdfFiles = watchDirectory.listFiles((dir, name) ->
                name.toLowerCase().endsWith(".pdf")
            );

            if (pdfFiles == null || pdfFiles.length == 0) {
                return;
            }

            // Trier par date de modification (plus anciens en premier)
            Arrays.sort(pdfFiles, Comparator.comparingLong(File::lastModified));

            log.info("{} fichier(s) PDF trouvé(s) dans: {}", pdfFiles.length, watchDir);

            int success = 0;
            int errors = 0;

            for (File pdfFile : pdfFiles) {
                try {
                    // Vérifier que le fichier est stable (pas en cours d'écriture)
                    if (!isFileStable(pdfFile)) {
                        log.debug("Fichier pas encore stable, on le repasse au prochain cycle: {}", pdfFile.getName());
                        continue;
                    }
                    processFile(pdfFile);
                    success++;
                } catch (Exception e) {
                    errors++;
                    log.error("Erreur lors du traitement du fichier: {}", pdfFile.getName(), e);
                    // Déplacer vers le dossier error
                    try {
                        fileService.moveToError(pdfFile);
                    } catch (IOException ioEx) {
                        log.error("Impossible de déplacer le fichier en erreur: {}", pdfFile.getName(), ioEx);
                    }
                }
            }

            if (success > 0 || errors > 0) {
                log.info("Scan terminé: {} succès, {} erreurs", success, errors);
            }

        } catch (Exception e) {
            log.error("Erreur lors du scan du répertoire surveillé", e);
        } finally {
            isProcessing = false;
        }
    }

    /**
     * Traite un fichier PDF trouvé dans le répertoire surveillé
     */
    private void processFile(File file) throws IOException {
        log.info("Traitement du fichier: {} ({}Ko)", file.getName(), file.length() / 1024);

        // Vérifier que le fichier est bien lisible et non vide
        if (!file.canRead()) {
            log.warn("Fichier non lisible: {}", file.getName());
            return;
        }

        if (file.length() == 0) {
            log.warn("Fichier vide ignoré: {}", file.getName());
            return;
        }

        // Sauvegarder le fichier dans le répertoire d'upload
        String savedFilePath = fileService.saveWatchedFile(file);

        // Importer le résultat dans la base de données
        var result = patientResultService.importResultFromFile(savedFilePath, file.getName());

        if (result != null) {
            // Déplacer le fichier vers le répertoire "processed"
            fileService.moveToProcessed(file);
            log.info("✓ Fichier traité avec succès: {} → Réf: {}", file.getName(), result.getReferenceDossier());
        } else {
            log.warn("Fichier déjà importé ou ignoré: {}", file.getName());
            fileService.moveToProcessed(file); // On le déplace quand même pour ne pas le retraiter
        }
    }

    /**
     * Vérifie qu'un fichier est stable (pas en cours d'écriture).
     * Compare la taille du fichier à deux instants séparés de 500ms.
     */
    private boolean isFileStable(File file) {
        long size1 = file.length();
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
        long size2 = file.length();
        return size1 == size2 && size2 > 0;
    }

    /**
     * Récupère le chemin effectif du répertoire surveillé.
     * Priorité: BD > application.yml
     */
    private String getEffectiveWatchDir() {
        try {
            return appSettingService.getWatchDirectory(defaultWatchDir);
        } catch (Exception e) {
            return defaultWatchDir;
        }
    }
}
