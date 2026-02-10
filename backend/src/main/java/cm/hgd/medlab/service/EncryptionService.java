package cm.hgd.medlab.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

/**
 * Service de chiffrement AES-256-GCM pour les données sensibles (PDFs patients)
 * 
 * Conformité:
 * - AES-256: Standard recommandé pour données médicales
 * - GCM: Mode authentifié (intégrité + confidentialité)
 * - Sel et IV uniques par document
 * 
 * IMPORTANT: La clé de chiffrement doit être:
 * - Stockée dans un fichier .env sécurisé
 * - Différente entre dev et production
 * - Sauvegardée séparément de la base de données
 * - Si perdue = données irrécupérables!
 */
@Service
@Slf4j
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;      // 96 bits
    private static final int GCM_TAG_LENGTH = 128;    // 128 bits
    private static final int SALT_LENGTH = 16;        // 128 bits
    private static final int KEY_LENGTH = 256;        // AES-256
    private static final int ITERATION_COUNT = 65536; // PBKDF2 iterations

    @Value("${medlab.security.encryption-key:CHANGE_THIS_KEY_IN_PRODUCTION_32_CHARS}")
    private String masterPassword;

    /**
     * Chiffre des données binaires (PDF) avec AES-256-GCM
     * 
     * Format du résultat: [SALT (16 bytes)][IV (12 bytes)][ENCRYPTED DATA]
     * 
     * @param plainData Les données en clair à chiffrer
     * @return Les données chiffrées avec sel et IV préfixés
     */
    public byte[] encrypt(byte[] plainData) {
        try {
            log.debug("Chiffrement de {} octets", plainData.length);
            
            // Générer un sel aléatoire pour dériver la clé
            byte[] salt = new byte[SALT_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(salt);
            
            // Générer un IV (Initialization Vector) aléatoire
            byte[] iv = new byte[GCM_IV_LENGTH];
            random.nextBytes(iv);
            
            // Dériver la clé AES à partir du mot de passe maître
            SecretKey key = deriveKey(masterPassword, salt);
            
            // Configurer le cipher AES-GCM
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, spec);
            
            // Chiffrer les données
            byte[] encryptedData = cipher.doFinal(plainData);
            
            // Combiner: SALT + IV + ENCRYPTED_DATA
            ByteBuffer buffer = ByteBuffer.allocate(SALT_LENGTH + GCM_IV_LENGTH + encryptedData.length);
            buffer.put(salt);
            buffer.put(iv);
            buffer.put(encryptedData);
            
            byte[] result = buffer.array();
            log.debug("Données chiffrées: {} octets -> {} octets", plainData.length, result.length);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erreur lors du chiffrement", e);
            throw new RuntimeException("Erreur de chiffrement: " + e.getMessage(), e);
        }
    }

    /**
     * Déchiffre des données chiffrées avec AES-256-GCM
     * 
     * @param encryptedData Les données chiffrées (avec sel et IV préfixés)
     * @return Les données déchiffrées en clair
     */
    public byte[] decrypt(byte[] encryptedData) {
        try {
            log.debug("Déchiffrement de {} octets", encryptedData.length);
            
            // Extraire le sel, l'IV et les données chiffrées
            ByteBuffer buffer = ByteBuffer.wrap(encryptedData);
            
            byte[] salt = new byte[SALT_LENGTH];
            buffer.get(salt);
            
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            
            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);
            
            // Dériver la clé à partir du même mot de passe et sel
            SecretKey key = deriveKey(masterPassword, salt);
            
            // Configurer le cipher pour le déchiffrement
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, spec);
            
            // Déchiffrer
            byte[] plainData = cipher.doFinal(cipherText);
            log.debug("Données déchiffrées: {} octets", plainData.length);
            
            return plainData;
            
        } catch (Exception e) {
            log.error("Erreur lors du déchiffrement", e);
            throw new RuntimeException("Erreur de déchiffrement: " + e.getMessage(), e);
        }
    }

    /**
     * Vérifie si des données sont chiffrées
     * (Simple heuristique basée sur la taille et le header PDF)
     */
    public boolean isEncrypted(byte[] data) {
        if (data == null || data.length < SALT_LENGTH + GCM_IV_LENGTH + 16) {
            return false;
        }
        
        // Un PDF commence par %PDF-, si on voit ça = pas chiffré
        if (data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46) {
            return false; // C'est un PDF non chiffré
        }
        
        return true; // Probablement chiffré
    }

    /**
     * Dérive une clé AES-256 à partir d'un mot de passe et d'un sel
     * Utilise PBKDF2 avec SHA-256
     */
    private SecretKey deriveKey(String password, byte[] salt) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATION_COUNT, KEY_LENGTH);
        SecretKey tmp = factory.generateSecret(spec);
        return new SecretKeySpec(tmp.getEncoded(), "AES");
    }

    /**
     * Génère une clé de chiffrement aléatoire sécurisée
     * À utiliser pour générer la clé de production
     */
    public static String generateSecureKey() {
        byte[] key = new byte[32]; // 256 bits
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}
