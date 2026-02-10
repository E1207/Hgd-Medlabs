package cm.hgd.medlab.repository;

import cm.hgd.medlab.model.entity.AccessLog;
import cm.hgd.medlab.model.entity.PatientResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository pour l'entité AccessLog
 */
@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, UUID> {

    List<AccessLog> findByPatientResult(PatientResult patientResult);

    List<AccessLog> findByPatientResultOrderByAccessedAtDesc(PatientResult patientResult);

    Long countByPatientResultAndAccessSuccessful(PatientResult patientResult, Boolean accessSuccessful);
}
