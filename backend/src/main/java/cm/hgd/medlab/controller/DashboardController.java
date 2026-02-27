package cm.hgd.medlab.controller;

import cm.hgd.medlab.dto.response.DashboardStatsResponse;
import cm.hgd.medlab.dto.response.PatientResultResponse;
import cm.hgd.medlab.service.PatientResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour le dashboard et les statistiques
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "API pour le dashboard et les statistiques")
public class DashboardController {

    private final PatientResultService patientResultService;

    @GetMapping("/stats")
    @Operation(summary = "Statistiques globales", description = "Récupère les KPIs et statistiques pour le dashboard")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestParam(defaultValue = "0") int weekOffset
    ) {
        DashboardStatsResponse stats = patientResultService.getDashboardStats(weekOffset);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-results")
    @Operation(summary = "Résultats récents", description = "Récupère les derniers résultats traités")
    public ResponseEntity<List<PatientResultResponse>> getRecentResults(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<PatientResultResponse> results = patientResultService.getRecentResults(limit);
        return ResponseEntity.ok(results);
    }
}
