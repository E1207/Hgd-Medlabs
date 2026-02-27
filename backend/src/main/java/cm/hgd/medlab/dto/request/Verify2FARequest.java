package cm.hgd.medlab.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la vérification du code 2FA
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Verify2FARequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    private String email;

    @NotBlank(message = "Le code est obligatoire")
    @Size(min = 6, max = 6, message = "Le code doit contenir 6 chiffres")
    private String code;

    private String sessionToken;
}
