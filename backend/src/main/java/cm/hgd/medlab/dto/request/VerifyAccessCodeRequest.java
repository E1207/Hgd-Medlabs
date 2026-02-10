package cm.hgd.medlab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour vérifier le code d'accès à un résultat
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyAccessCodeRequest {

    @NotBlank(message = "Le code d'accès est obligatoire")
    private String accessCode;
}
