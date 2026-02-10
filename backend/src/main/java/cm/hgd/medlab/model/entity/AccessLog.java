package cm.hgd.medlab.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entité pour logger les accès aux résultats patients
 */
@Entity
@Table(name = "access_logs", indexes = {
    @Index(name = "idx_patient_result_id", columnList = "patient_result_id"),
    @Index(name = "idx_accessed_at", columnList = "accessed_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_result_id", nullable = false)
    private PatientResult patientResult;

    @CreationTimestamp
    @Column(name = "accessed_at", nullable = false)
    private LocalDateTime accessedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "access_successful", nullable = false)
    @Builder.Default
    private Boolean accessSuccessful = false;

    @Column(name = "access_type", length = 50)
    @Builder.Default
    private String accessType = "EMAIL_CODE";  // EMAIL_CODE, OTP_WHATSAPP
}
