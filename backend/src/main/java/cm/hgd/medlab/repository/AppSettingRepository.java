package cm.hgd.medlab.repository;

import cm.hgd.medlab.model.entity.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les paramètres de l'application
 */
@Repository
public interface AppSettingRepository extends JpaRepository<AppSetting, String> {

    Optional<AppSetting> findBySettingKey(String settingKey);
}
