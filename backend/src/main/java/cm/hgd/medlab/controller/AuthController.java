package cm.hgd.medlab.controller;

import cm.hgd.medlab.dto.request.LoginRequest;
import cm.hgd.medlab.dto.request.Verify2FARequest;
import cm.hgd.medlab.dto.response.LoginResponse;
import cm.hgd.medlab.dto.response.UserResponse;
import cm.hgd.medlab.model.entity.User;
import cm.hgd.medlab.service.AuthService;
import cm.hgd.medlab.service.TwoFactorStatusService;
import cm.hgd.medlab.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur pour l'authentification
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API d'authentification")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final TwoFactorStatusService twoFactorStatusService;

    @PostMapping("/login")
    @Operation(summary = "Connexion", description = "Authentifie un utilisateur et retourne un token JWT ou demande le 2FA")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-2fa")
    @Operation(summary = "Vérifier le code 2FA", description = "Vérifie le code 2FA et complète la connexion")
    public ResponseEntity<LoginResponse> verify2FA(@Valid @RequestBody Verify2FARequest request) {
        LoginResponse response = authService.verify2FA(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Utilisateur connecté", description = "Récupère les informations de l'utilisateur connecté")
    public ResponseEntity<UserResponse> getCurrentUser() {
        User user = authService.getCurrentUser();
        UserResponse response = userService.getUserById(user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/2fa/status")
    @Operation(summary = "Statut 2FA", description = "Récupère le statut du 2FA")
    public ResponseEntity<Map<String, Object>> get2FAStatus() {
        return ResponseEntity.ok(Map.of(
            "globalEnabled", twoFactorStatusService.isGlobalEnabled(),
            "enabledUsers", twoFactorStatusService.getEnabled2FAUsers()
        ));
    }

    @PostMapping("/2fa/enable-global")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer 2FA global", description = "Active le 2FA pour toute l'organisation (add-on)")
    public ResponseEntity<Map<String, String>> enableGlobal2FA() {
        twoFactorStatusService.enableGlobal2FA();
        return ResponseEntity.ok(Map.of("message", "2FA activé globalement"));
    }

    @PostMapping("/2fa/disable-global")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Désactiver 2FA global", description = "Désactive le 2FA global")
    public ResponseEntity<Map<String, String>> disableGlobal2FA() {
        twoFactorStatusService.disableGlobal2FA();
        return ResponseEntity.ok(Map.of("message", "2FA désactivé globalement"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion", description = "Déconnecte l'utilisateur (côté client)")
    public ResponseEntity<Void> logout() {
        // La déconnexion est gérée côté client en supprimant le token
        return ResponseEntity.ok().build();
    }
}
