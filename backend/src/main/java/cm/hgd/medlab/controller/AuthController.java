package cm.hgd.medlab.controller;

import cm.hgd.medlab.dto.request.LoginRequest;
import cm.hgd.medlab.dto.response.LoginResponse;
import cm.hgd.medlab.dto.response.UserResponse;
import cm.hgd.medlab.model.entity.User;
import cm.hgd.medlab.service.AuthService;
import cm.hgd.medlab.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/login")
    @Operation(summary = "Connexion", description = "Authentifie un utilisateur et retourne un token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Utilisateur connecté", description = "Récupère les informations de l'utilisateur connecté")
    public ResponseEntity<UserResponse> getCurrentUser() {
        User user = authService.getCurrentUser();
        UserResponse response = userService.getUserById(user.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion", description = "Déconnecte l'utilisateur (côté client)")
    public ResponseEntity<Void> logout() {
        // La déconnexion est gérée côté client en supprimant le token
        return ResponseEntity.ok().build();
    }
}
