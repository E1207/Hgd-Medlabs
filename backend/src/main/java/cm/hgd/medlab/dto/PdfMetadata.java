package cm.hgd.medlab.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO pour les métadonnées extraites d'un PDF
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdfMetadata {
    private String referenceDossier;
    private String firstName;
    private String lastName;
    private LocalDate birthdate;
    private String email;
    private String phone;
}
