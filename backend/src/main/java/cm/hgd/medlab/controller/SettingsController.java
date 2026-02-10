package cm.hgd.medlab.controller;

import cm.hgd.medlab.model.entity.AppSetting;
import cm.hgd.medlab.service.AppSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour la gestion des paramètres de l'application
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Settings", description = "API de gestion des paramètres")
public class SettingsController {

    private final AppSettingService appSettingService;

    @GetMapping
    @Operation(summary = "Liste des paramètres", description = "Récupère tous les paramètres de l'application")
    public ResponseEntity<List<AppSetting>> getAllSettings() {
        return ResponseEntity.ok(appSettingService.getAllSettings());
    }

    @GetMapping("/{key}")
    @Operation(summary = "Détails d'un paramètre", description = "Récupère un paramètre par sa clé")
    public ResponseEntity<AppSetting> getSetting(@PathVariable String key) {
        return appSettingService.getSetting(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{key}")
    @Operation(summary = "Modifier un paramètre", description = "Met à jour la valeur d'un paramètre")
    public ResponseEntity<AppSetting> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> body
    ) {
        String value = body.get("value");
        String description = body.get("description");

        if (value == null) {
            return ResponseEntity.badRequest().build();
        }

        AppSetting setting = appSettingService.saveSetting(key, value, description);
        return ResponseEntity.ok(setting);
    }

    @PostMapping
    @Operation(summary = "Créer un paramètre", description = "Crée un nouveau paramètre")
    public ResponseEntity<AppSetting> createSetting(@RequestBody Map<String, String> body) {
        String key = body.get("key");
        String value = body.get("value");
        String description = body.get("description");

        if (key == null || value == null) {
            return ResponseEntity.badRequest().build();
        }

        AppSetting setting = appSettingService.saveSetting(key, value, description);
        return ResponseEntity.ok(setting);
    }
}
