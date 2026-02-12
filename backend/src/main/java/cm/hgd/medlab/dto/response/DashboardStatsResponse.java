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
