package cm.hgd.medlab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
