package cm.hgd.medlab.service;

import cm.hgd.medlab.dto.request.UserRequest;
import cm.hgd.medlab.dto.response.UserResponse;
import cm.hgd.medlab.model.entity.User;
import cm.hgd.medlab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des utilisateurs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Récupère tous les utilisateurs
     */
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un utilisateur par son ID
     */
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));
        return convertToResponse(user);
    }

    /**
     * Crée un nouvel utilisateur
     */
    @Transactional
    public UserResponse createUser(UserRequest request) {
        log.info("Création d'un nouvel utilisateur: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un utilisateur existe déjà avec cet email: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        user = userRepository.save(user);
        log.info("Utilisateur créé avec succès: {}", user.getEmail());

        return convertToResponse(user);
    }

    /**
     * Met à jour un utilisateur
     */
    @Transactional
    public UserResponse updateUser(UUID id, UserRequest request) {
        log.info("Mise à jour de l'utilisateur: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));

        // Vérifier si l'email est modifié et s'il n'existe pas déjà
        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un utilisateur existe déjà avec cet email: " + request.getEmail());
        }

        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        user = userRepository.save(user);
        log.info("Utilisateur mis à jour avec succès: {}", user.getEmail());

        return convertToResponse(user);
    }

    /**
     * Supprime un utilisateur
     */
    @Transactional
    public void deleteUser(UUID id) {
        log.info("Suppression de l'utilisateur: {}", id);

        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur non trouvé avec l'ID: " + id);
        }

        userRepository.deleteById(id);
        log.info("Utilisateur supprimé avec succès: {}", id);
    }

    /**
     * Convertit une entité User en UserResponse
     */
    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
