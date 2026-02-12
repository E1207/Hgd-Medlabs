package cm.hgd.medlab.repository;

import cm.hgd.medlab.model.entity.PatientResult;
import cm.hgd.medlab.model.enums.ResultStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository pour l'entité PatientResult
 */
@Repository
public interface PatientResultRepository extends JpaRepository<PatientResult, UUID> {

    Optional<PatientResult> findByReferenceDossier(String referenceDossier);

    boolean existsByReferenceDossier(String referenceDossier);

    List<PatientResult> findByStatus(ResultStatus status);

    List<PatientResult> findByPatientEmail(String email);

    List<PatientResult> findByPatientPhone(String phone);

    @Query("SELECT pr FROM PatientResult pr WHERE pr.status = :status " +
           "AND pr.sentAt BETWEEN :startDate AND :endDate")
    List<PatientResult> findByStatusAndSentAtBetween(
            @Param("status") ResultStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT pr FROM PatientResult pr LEFT JOIN FETCH pr.importedBy WHERE " +
           "LOWER(pr.referenceDossier) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(pr.patientFirstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(pr.patientLastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(pr.patientEmail) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<PatientResult> searchResults(@Param("search") String search, Pageable pageable);

    @Query("SELECT pr FROM PatientResult pr LEFT JOIN FETCH pr.importedBy WHERE " +
           "(CAST(:status AS string) IS NULL OR pr.status = :status) AND " +
           "(CAST(:startDate AS string) IS NULL OR pr.createdAt >= :startDate) AND " +
           "(CAST(:endDate AS string) IS NULL OR pr.createdAt <= :endDate)")
    Page<PatientResult> findByFilters(
            @Param("status") ResultStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT pr FROM PatientResult pr LEFT JOIN FETCH pr.importedBy ORDER BY pr.createdAt DESC")
    Page<PatientResult> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT pr FROM PatientResult pr LEFT JOIN FETCH pr.importedBy WHERE pr.status = :status ORDER BY pr.createdAt DESC")
    Page<PatientResult> findByStatusOrderByCreatedAtDesc(@Param("status") ResultStatus status, Pageable pageable);

    @Query("SELECT COUNT(pr) FROM PatientResult pr WHERE pr.status = :status")
    Long countByStatus(@Param("status") ResultStatus status);

    @Query("SELECT COUNT(pr) FROM PatientResult pr WHERE pr.sentAt >= :startDate")
    Long countSentSince(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT pr FROM PatientResult pr LEFT JOIN FETCH pr.importedBy ORDER BY pr.createdAt DESC")
    List<PatientResult> findRecentResults(Pageable pageable);

    // Statistiques hebdomadaires
    @Query("SELECT COUNT(pr) FROM PatientResult pr WHERE pr.createdAt >= :startDate AND pr.createdAt < :endDate")
    Long countCreatedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(pr) FROM PatientResult pr WHERE pr.sentAt >= :startDate AND pr.sentAt < :endDate")
    Long countSentBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(pr) FROM PatientResult pr WHERE pr.status = 'OPENED' AND pr.openedAt >= :startDate AND pr.openedAt < :endDate")
    Long countOpenedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
