package cm.hgd.medlab.service;

import cm.hgd.medlab.model.entity.AppSetting;
import cm.hgd.medlab.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service pour la gestion des paramètres de l'application
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppSettingService {

    private final AppSettingRepository appSettingRepository;

    // Clés de paramètres connues
    public static final String KEY_WATCH_DIR = "watch_directory";
    public static final String KEY_SCHEDULER_ENABLED = "scheduler_enabled";
    public static final String KEY_SCHEDULER_DELAY = "scheduler_delay_ms";
    public static final String KEY_HOSPITAL_NAME = "hospital_name";

    /**
     * Récupère tous les paramètres
     */
    public List<AppSetting> getAllSettings() {
        return appSettingRepository.findAll();
    }

    /**
     * Récupère un paramètre par sa clé
     */
    public Optional<AppSetting> getSetting(String key) {
        return appSettingRepository.findBySettingKey(key);
    }

    /**
     * Récupère la valeur d'un paramètre, ou une valeur par défaut
     */
    public String getSettingValue(String key, String defaultValue) {
        return appSettingRepository.findBySettingKey(key)
                .map(AppSetting::getSettingValue)
                .orElse(defaultValue);
    }

    /**
     * Met à jour ou crée un paramètre
     */
    @Transactional
    public AppSetting saveSetting(String key, String value, String description) {
        log.info("Mise à jour du paramètre: {} = {}", key, value);

        AppSetting setting = appSettingRepository.findBySettingKey(key)
                .orElse(AppSetting.builder()
                        .settingKey(key)
                        .build());

        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }

        return appSettingRepository.save(setting);
    }

    /**
     * Met à jour un paramètre existant
     */
    @Transactional
    public AppSetting updateSetting(String key, String value) {
        log.info("Mise à jour du paramètre: {} = {}", key, value);

        AppSetting setting = appSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new RuntimeException("Paramètre non trouvé: " + key));

        setting.setSettingValue(value);
        return appSettingRepository.save(setting);
    }

    /**
     * Récupère le chemin du répertoire surveillé (depuis la BD ou la config par défaut)
     */
    public String getWatchDirectory(String defaultDir) {
        return getSettingValue(KEY_WATCH_DIR, defaultDir);
    }

    /**
     * Vérifie si le scheduler est activé (depuis la BD)
     */
    public boolean isSchedulerEnabled(boolean defaultValue) {
        String value = getSettingValue(KEY_SCHEDULER_ENABLED, String.valueOf(defaultValue));
        return Boolean.parseBoolean(value);
    }
}
