package cm.hgd.medlab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO pour les statistiques du dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private Long totalResults;
    private Long resultsSentToday;
    private Long resultsAwaitingCompletion;
    private Double openRate;
    private Map<String, Long> statusDistribution;
    
    // Statistiques hebdomadaires
    private List<DailyStats> weeklyStats;
    
    // Navigation de période
    private Integer weekOffset;       // 0 = semaine actuelle, 1 = semaine précédente, etc.
    private String periodStart;       // Date de début de la période (format YYYY-MM-DD)
    private String periodEnd;         // Date de fin de la période (format YYYY-MM-DD)
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyStats {
        private String date;          // Format: YYYY-MM-DD
        private String dayLabel;      // Ex: "Lun 10"
        private Long importedCount;   // Nombre de résultats importés ce jour
        private Long sentCount;       // Nombre de résultats envoyés ce jour
        private Double openRate;      // Taux d'ouverture ce jour
    }
}
