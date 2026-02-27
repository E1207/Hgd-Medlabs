package cm.hgd.medlab.service;

import cm.hgd.medlab.dto.request.LoginRequest;
import cm.hgd.medlab.dto.request.Verify2FARequest;
import cm.hgd.medlab.dto.response.LoginResponse;
import cm.hgd.medlab.model.entity.User;
import cm.hgd.medlab.repository.UserRepository;
import cm.hgd.medlab.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service pour l'authentification
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final TwoFactorStatusService twoFactorStatusService;

    /**
     * Authentifie un utilisateur et retourne un token JWT ou demande le 2FA
     */
    public LoginResponse login(LoginRequest request) {
        log.info("Tentative de connexion pour l'utilisateur: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier si le 2FA est activé pour cet utilisateur
        if (twoFactorStatusService.is2FAEnabled(user.getEmail())) {
            log.info("2FA activé pour {}. Envoi du code...", request.getEmail());
            
            // Générer et envoyer le code OTP
            OtpService.OtpResult otpResult = otpService.generateOtp(user.getEmail());
            emailService.send2FACode(user.getEmail(), user.getFirstName(), otpResult.code());
            
            // Retourner une réponse indiquant que le 2FA est requis
            return LoginResponse.builder()
                    .requires2FA(true)
                    .sessionToken(otpResult.sessionToken())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .build();
        }

        // Pas de 2FA - connexion normale
        String token = jwtTokenProvider.generateToken(user);

        log.info("Connexion réussie pour l'utilisateur: {}", request.getEmail());

        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .requires2FA(false)
                .build();
    }

    /**
     * Vérifie le code 2FA et complète la connexion
     */
    public LoginResponse verify2FA(Verify2FARequest request) {
        log.info("Vérification du code 2FA pour: {}", request.getEmail());

        // Vérifier le code OTP
        boolean isValid = otpService.verifyOtp(request.getSessionToken(), request.getCode(), request.getEmail());
        
        if (!isValid) {
            log.warn("Code 2FA invalide pour: {}", request.getEmail());
            throw new RuntimeException("Code de vérification invalide ou expiré");
        }

        // Code valide - générer le token JWT
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String token = jwtTokenProvider.generateToken(user);

        log.info("2FA validé, connexion réussie pour: {}", request.getEmail());

        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .requires2FA(false)
                .build();
    }

    /**
     * Récupère l'utilisateur actuellement connecté
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
