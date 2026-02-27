package cm.hgd.medlab.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre pour l'authentification JWT
 * Sécurisé avec gestion complète des erreurs
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        // Pas de header Authorization ou format invalide
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            
            // Validation basique du format JWT (3 parties séparées par des points)
            if (!isValidJwtFormat(jwt)) {
                log.warn("Format JWT invalide détecté depuis IP: {}", getClientIp(request));
                filterChain.doFilter(request, response);
                return;
            }
            
            final String userEmail = jwtTokenProvider.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                    
                    if (jwtTokenProvider.isTokenValid(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                } catch (UsernameNotFoundException e) {
                    log.warn("Utilisateur non trouvé pour le token: {}", userEmail);
                    // Ne pas exposer l'erreur, continuer sans authentification
                }
            }
        } catch (Exception e) {
            // Logger l'erreur mais ne pas exposer les détails
            log.error("Erreur lors du traitement du token JWT: {}", e.getMessage());
            // Continuer la chaîne de filtres sans authentification
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Vérifie le format basique d'un JWT (header.payload.signature)
     */
    private boolean isValidJwtFormat(String jwt) {
        if (jwt == null || jwt.isEmpty()) {
            return false;
        }
        String[] parts = jwt.split("\\.");
        return parts.length == 3 && 
               !parts[0].isEmpty() && 
               !parts[1].isEmpty() && 
               !parts[2].isEmpty();
    }
    
    /**
     * Récupère l'IP du client pour les logs de sécurité
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
