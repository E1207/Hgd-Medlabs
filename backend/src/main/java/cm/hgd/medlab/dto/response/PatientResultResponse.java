package cm.hgd.medlab.dto.response;

import cm.hgd.medlab.model.enums.ImportMethod;
import cm.hgd.medlab.model.enums.ResultStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO pour la réponse d'un résultat patient
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResultResponse {

    private UUID id;
    private String referenceDossier;
    private String patientFirstName;
    private String patientLastName;
    private LocalDate patientBirthdate;
    private String patientEmail;
    private String patientPhone;
    private String pdfFileName;
    private ResultStatus status;
    private ImportMethod importMethod;
    private LocalDateTime importedAt;
    private LocalDateTime sentAt;
    private LocalDateTime openedAt;
    private String importedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
