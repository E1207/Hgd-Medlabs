package cm.hgd.medlab.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service pour générer et valider les tokens JWT
 * Sécurisé avec gestion complète des erreurs
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${medlab.security.jwt-secret}")
    private String jwtSecret;

    @Value("${medlab.security.jwt-expiration}")
    private long jwtExpiration;

    /**
     * Extrait le username (email) du token de manière sécurisée
     */
    public String extractUsername(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (JwtException e) {
            log.warn("Impossible d'extraire le username du token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extrait une claim spécifique du token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Génère un token JWT pour un utilisateur
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Génère un token JWT avec des claims supplémentaires
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Valide un token JWT de manière sécurisée
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            if (username == null) {
                return false;
            }
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (ExpiredJwtException e) {
            log.debug("Token expiré pour l'utilisateur: {}", userDetails.getUsername());
            return false;
        } catch (SignatureException e) {
            log.warn("Signature JWT invalide - tentative de falsification détectée");
            return false;
        } catch (MalformedJwtException e) {
            log.warn("Token JWT malformé");
            return false;
        } catch (UnsupportedJwtException e) {
            log.warn("Token JWT non supporté");
            return false;
        } catch (Exception e) {
            log.error("Erreur lors de la validation du token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Vérifie si le token est expiré
     */
    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Extrait la date d'expiration du token
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extrait toutes les claims du token
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Récupère la clé de signature
     */
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
