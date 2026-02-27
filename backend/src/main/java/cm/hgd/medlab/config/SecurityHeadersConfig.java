package cm.hgd.medlab.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filtre pour ajouter les headers de sécurité HTTP
 * Protège contre XSS, Clickjacking, MIME sniffing, etc.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersConfig implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Protection contre le MIME type sniffing
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");
        
        // Protection contre le Clickjacking
        httpResponse.setHeader("X-Frame-Options", "DENY");
        
        // Protection XSS (navigateurs anciens)
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
        
        // Content Security Policy - Restreindre les sources de contenu
        httpResponse.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https:; " +
            "frame-ancestors 'none';"
        );
        
        // Referrer Policy - Limiter les informations envoyées
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Permissions Policy - Désactiver les fonctionnalités non utilisées
        httpResponse.setHeader("Permissions-Policy", 
            "geolocation=(), microphone=(), camera=(), payment=()"
        );
        
        // Cache-Control pour les réponses API sensibles
        httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        httpResponse.setHeader("Pragma", "no-cache");
        
        chain.doFilter(request, response);
    }
}
