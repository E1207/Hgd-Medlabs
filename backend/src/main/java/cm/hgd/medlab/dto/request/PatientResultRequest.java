package cm.hgd.medlab.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * DTO pour créer/mettre à jour un résultat patient
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResultRequest {

    @NotBlank(message = "La référence du dossier est obligatoire")
    @Size(min = 3, max = 50, message = "La référence doit contenir entre 3 et 50 caractères")
    @Pattern(regexp = "^[A-Za-z0-9\\-_/]+$", message = "La référence ne peut contenir que des lettres, chiffres, tirets et underscores")
    private String referenceDossier;

    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    private String patientFirstName;

    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String patientLastName;

    @DateTimeFormat(pattern = "dd/MM/yyyy")
    private LocalDate patientBirthdate;

    @Email(message = "Format d'email invalide")
    @Size(max = 255, message = "L'email ne peut pas dépasser 255 caractères")
    private String patientEmail;

    @Size(max = 20, message = "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    @Pattern(regexp = "^[+]?[0-9\\s\\-()]*$", message = "Format de téléphone invalide")
    private String patientPhone;
}
