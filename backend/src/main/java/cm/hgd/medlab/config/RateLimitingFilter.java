package cm.hgd.medlab.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtre de Rate Limiting pour protéger contre les attaques brute force
 * Limite le nombre de requêtes par IP sur les endpoints sensibles
 */
@Component
@Slf4j
public class RateLimitingFilter implements Filter {

    // Cache des compteurs par IP
    private final Map<String, RateLimitEntry> ipCounters = new ConcurrentHashMap<>();
    
    // Configuration
    private static final int MAX_REQUESTS_PER_MINUTE = 30;  // Max requêtes par minute sur /login
    private static final int MAX_REQUESTS_PER_MINUTE_PUBLIC = 60; // Max pour /public
    private static final int BLOCK_DURATION_MINUTES = 5;     // Durée du blocage après dépassement
    private static final long WINDOW_SIZE_MS = 60_000;       // Fenêtre de 1 minute

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String path = httpRequest.getRequestURI();
        
        // Appliquer le rate limiting uniquement sur les endpoints sensibles
        if (shouldRateLimit(path)) {
            String clientIp = getClientIpAddress(httpRequest);
            String key = clientIp + ":" + getRateLimitCategory(path);
            
            RateLimitEntry entry = ipCounters.computeIfAbsent(key, k -> new RateLimitEntry());
            
            // Nettoyer les entrées expirées
            cleanupExpiredEntries();
            
            // Vérifier si l'IP est bloquée
            if (entry.isBlocked()) {
                log.warn("IP bloquée - tentative d'accès refusée: {} -> {}", clientIp, path);
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Trop de requêtes. Réessayez dans quelques minutes.\",\"retryAfter\":" + entry.getBlockedSecondsRemaining() + "}");
                return;
            }
            
            // Incrémenter le compteur
            int count = entry.incrementAndGet();
            int maxRequests = getMaxRequestsForPath(path);
            
            if (count > maxRequests) {
                // Bloquer l'IP
                entry.block(BLOCK_DURATION_MINUTES);
                log.warn("Rate limit dépassé pour IP {}: {} requêtes sur {} -> blocage {} min", 
                        clientIp, count, path, BLOCK_DURATION_MINUTES);
                
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Trop de requêtes. Vous êtes temporairement bloqué.\",\"retryAfter\":" + (BLOCK_DURATION_MINUTES * 60) + "}");
                return;
            }
            
            // Ajouter les headers de rate limiting
            httpResponse.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
            httpResponse.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxRequests - count)));
            httpResponse.setHeader("X-RateLimit-Reset", String.valueOf((entry.getWindowStart() + WINDOW_SIZE_MS) / 1000));
        }
        
        chain.doFilter(request, response);
    }

    private boolean shouldRateLimit(String path) {
        return path.contains("/api/auth/login") || 
               path.contains("/api/auth/verify-2fa") ||
               path.contains("/api/public/");
    }

    private String getRateLimitCategory(String path) {
        if (path.contains("/login") || path.contains("/verify-2fa")) {
            return "auth";
        }
        return "public";
    }

    private int getMaxRequestsForPath(String path) {
        if (path.contains("/login") || path.contains("/verify-2fa")) {
            return MAX_REQUESTS_PER_MINUTE;
        }
        return MAX_REQUESTS_PER_MINUTE_PUBLIC;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String[] headers = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP"
        };
        
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For peut contenir plusieurs IPs, prendre la première
                return ip.split(",")[0].trim();
            }
        }
        
        return request.getRemoteAddr();
    }

    private void cleanupExpiredEntries() {
        long now = System.currentTimeMillis();
        ipCounters.entrySet().removeIf(entry -> 
            entry.getValue().isExpired(now, WINDOW_SIZE_MS)
        );
    }

    /**
     * Classe interne pour tracker les requêtes par IP
     */
    private static class RateLimitEntry {
        private final AtomicInteger counter = new AtomicInteger(0);
        private long windowStart = System.currentTimeMillis();
        private long blockedUntil = 0;

        public synchronized int incrementAndGet() {
            long now = System.currentTimeMillis();
            
            // Réinitialiser si la fenêtre est expirée
            if (now - windowStart > 60_000) {
                counter.set(0);
                windowStart = now;
            }
            
            return counter.incrementAndGet();
        }

        public boolean isBlocked() {
            return System.currentTimeMillis() < blockedUntil;
        }

        public void block(int minutes) {
            blockedUntil = System.currentTimeMillis() + (minutes * 60_000L);
        }

        public int getBlockedSecondsRemaining() {
            long remaining = blockedUntil - System.currentTimeMillis();
            return Math.max(0, (int) (remaining / 1000));
        }

        public long getWindowStart() {
            return windowStart;
        }

        public boolean isExpired(long now, long windowSize) {
            return !isBlocked() && (now - windowStart > windowSize * 2);
        }
    }
}
