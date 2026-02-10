package cm.hgd.medlab.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entité pour les paramètres de l'application (clé/valeur)
 * Permet de stocker des configurations dynamiques comme le chemin du répertoire surveillé
 */
@Entity
@Table(name = "app_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSetting {

    @Id
    @Column(name = "setting_key", length = 100)
    private String settingKey;

    @Column(name = "setting_value", length = 1000, nullable = false)
    private String settingValue;

    @Column(name = "description", length = 500)
    private String description;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
