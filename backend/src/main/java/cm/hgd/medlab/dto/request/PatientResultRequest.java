package cm.hgd.medlab.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
    private String referenceDossier;

    private String patientFirstName;

    private String patientLastName;

    @DateTimeFormat(pattern = "dd/MM/yyyy")
    private LocalDate patientBirthdate;

    @Email(message = "Format d'email invalide")
    private String patientEmail;

    private String patientPhone;
}
