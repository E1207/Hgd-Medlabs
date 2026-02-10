package cm.hgd.medlab.model.entity;

import cm.hgd.medlab.model.enums.ImportMethod;
import cm.hgd.medlab.model.enums.ResultStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entité représentant un résultat d'examen médical patient
 */
@Entity
@Table(name = "patient_results", indexes = {
    @Index(name = "idx_reference_dossier", columnList = "reference_dossier"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_patient_email", columnList = "patient_email"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference_dossier", nullable = false, unique = true, length = 100)
    private String referenceDossier;

    @Column(name = "patient_first_name", length = 100)
    private String patientFirstName;

    @Column(name = "patient_last_name", length = 100)
    private String patientLastName;

    @Column(name = "patient_birthdate")
    private LocalDate patientBirthdate;

    @Column(name = "patient_email", length = 255)
    private String patientEmail;

    @Column(name = "patient_phone", length = 20)
    private String patientPhone;

    // ===== STOCKAGE PDF DANS POSTGRESQL =====
    // Le contenu binaire du PDF est stocké directement dans la base de données
    // Avantages: sécurité, intégrité, sauvegarde unique avec pg_dump
    
    @Lob
    @Column(name = "pdf_content", columnDefinition = "BYTEA")
    private byte[] pdfContent;
    
    @Column(name = "pdf_file_size")
    private Long pdfFileSize;
    
    @Column(name = "pdf_content_type", length = 100)
    @Builder.Default
    private String pdfContentType = "application/pdf";

    // Chemin legacy (pour migration, peut être null pour les nouveaux enregistrements)
    @Column(name = "pdf_file_path", length = 500)
    private String pdfFilePath;

    @Column(name = "pdf_file_name", nullable = false, length = 255)
    private String pdfFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ResultStatus status = ResultStatus.IMPORTED;

    @Column(name = "access_code_hash", length = 255)
    private String accessCodeHash;

    @Column(name = "access_attempts")
    @Builder.Default
    private Integer accessAttempts = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_method", nullable = false, length = 20)
    private ImportMethod importMethod;

    @Column(name = "imported_at", nullable = false)
    private LocalDateTime importedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by")
    private User importedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
