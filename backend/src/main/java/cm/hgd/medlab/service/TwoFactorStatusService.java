package cm.hgd.medlab.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

/**
 * Service pour gérer le statut 2FA des utilisateurs.
 * Ce service simule l'activation du 2FA via le système d'add-ons du Marketplace.
 * En production, cela serait lié à la base de données des abonnements.
 */
@Service
@Slf4j
public class TwoFactorStatusService {

    // Ensemble des emails pour lesquels le 2FA est activé
    // En production, ceci serait stocké en base de données
    private final Set<String> enabled2FAUsers = new HashSet<>();
    
    // Flag global pour activer le 2FA pour toute l'organisation (add-on acheté)
    private boolean globalEnabled = false;

    /**
     * Vérifie si le 2FA est activé pour un utilisateur
     */
    public boolean is2FAEnabled(String email) {
        // Si le 2FA global est activé (add-on acheté), tous les utilisateurs l'ont
        if (globalEnabled) {
            return true;
        }
        // Sinon, vérifier si l'utilisateur spécifique l'a activé
        return enabled2FAUsers.contains(email);
    }

    /**
     * Active le 2FA pour un utilisateur spécifique
     */
    public void enable2FAForUser(String email) {
        enabled2FAUsers.add(email);
        log.info("2FA activé pour l'utilisateur: {}", email);
    }

    /**
     * Désactive le 2FA pour un utilisateur spécifique
     */
    public void disable2FAForUser(String email) {
        enabled2FAUsers.remove(email);
        log.info("2FA désactivé pour l'utilisateur: {}", email);
    }

    /**
     * Active le 2FA globalement (quand l'add-on est acheté)
     */
    public void enableGlobal2FA() {
        globalEnabled = true;
        log.info("2FA activé globalement pour toute l'organisation");
    }

    /**
     * Désactive le 2FA globalement
     */
    public void disableGlobal2FA() {
        globalEnabled = false;
        log.info("2FA désactivé globalement");
    }

    /**
     * Vérifie si le 2FA global est activé
     */
    public boolean isGlobalEnabled() {
        return globalEnabled;
    }

    /**
     * Retourne la liste des utilisateurs avec 2FA activé individuellement
     */
    public Set<String> getEnabled2FAUsers() {
        return new HashSet<>(enabled2FAUsers);
    }
}
