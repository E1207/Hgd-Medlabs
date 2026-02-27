package cm.hgd.medlab;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class MedLabApplication {

    public static void main(String[] args) {
        // Charger les variables d'environnement depuis le fichier .env
        loadEnvFile();
        
        SpringApplication.run(MedLabApplication.class, args);
    }
    
    /**
     * Charge les variables du fichier .env dans les propriétés système.
     * Cherche le .env dans le dossier parent (racine du projet).
     */
    private static void loadEnvFile() {
        try {
            // Chercher le .env dans le dossier parent (racine du projet)
            Path envPath = Path.of("..", ".env");
            if (!Files.exists(envPath)) {
                // Essayer dans le dossier courant
                envPath = Path.of(".env");
            }
            
            if (Files.exists(envPath)) {
                Dotenv dotenv = Dotenv.configure()
                        .directory(envPath.getParent() != null ? envPath.getParent().toString() : ".")
                        .ignoreIfMissing()
                        .load();
                
                // Injecter toutes les variables dans les propriétés système
                dotenv.entries().forEach(entry -> {
                    if (System.getProperty(entry.getKey()) == null && 
                        System.getenv(entry.getKey()) == null) {
                        System.setProperty(entry.getKey(), entry.getValue());
                    }
                });
                
                System.out.println("✅ Fichier .env chargé avec succès (" + dotenv.entries().size() + " variables)");
            } else {
                System.out.println("⚠️ Fichier .env non trouvé - utilisation des valeurs par défaut");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Impossible de charger le fichier .env: " + e.getMessage());
        }
    }
}
