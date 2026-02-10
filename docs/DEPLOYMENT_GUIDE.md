# 📋 Guide de Déploiement Production - MedLab HGD

## 🏥 Hôpital Général de Douala - Système de Gestion des Résultats de Laboratoire

Ce document décrit le déploiement du système MedLab sur les serveurs de l'hôpital avec **stockage 100% local** des données.

---

## 📁 Architecture de Stockage Local

```
/var/medlab/
├── data/
│   ├── uploads/          # PDFs uploadés manuellement (conservés)
│   │   └── 2026/
│   │       ├── 01/       # Organisés par année/mois
│   │       └── 02/
│   ├── incoming/         # PDFs déposés automatiquement (FileWatcher)
│   ├── processed/        # PDFs traités avec succès
│   ├── error/            # PDFs en erreur
│   └── archives/         # PDFs archivés (> 1 an)
├── backups/              # Sauvegardes quotidiennes
│   ├── medlab_backup_20260210_020000.tar.gz
│   └── medlab_backup_20260211_020000.tar.gz
└── logs/
    ├── medlab.log        # Logs applicatifs
    └── backup.log        # Logs des sauvegardes
```

---

## ✅ Conformité Stockage Hospitalier

| Exigence | Implémentation |
|----------|----------------|
| **Stockage local** | ✅ Tous les fichiers sur serveur HGD |
| **Pas de cloud** | ✅ Aucun S3, Azure, Google Cloud |
| **Traçabilité** | ✅ Logs d'accès complets |
| **Sauvegardes** | ✅ Quotidiennes automatiques |
| **Rétention 10 ans** | ✅ Archivage automatique configurable |
| **Chiffrement** | ✅ HTTPS + chiffrement disque recommandé |

---

## 🖥️ Prérequis Serveur

### Matériel Minimum
- **CPU**: 4 cœurs
- **RAM**: 8 Go
- **Stockage**: 500 Go SSD (extensible selon volume)
- **Réseau**: Connexion LAN 1 Gbps

### Logiciels
- **OS**: Ubuntu 22.04 LTS / Debian 12 / RHEL 9
- **Java**: OpenJDK 21
- **Base de données**: PostgreSQL 15+
- **Reverse Proxy**: Nginx (pour HTTPS)

---

## 🚀 Installation Rapide

```bash
# 1. Cloner le projet
git clone https://github.com/hgd-douala/medlab.git
cd medlab

# 2. Compiler l'application
cd backend
mvn clean package -DskipTests

# 3. Exécuter le script d'installation (en tant que root)
cd ..
sudo bash scripts/install.sh

# 4. Configurer (IMPORTANT!)
sudo nano /opt/medlab/.env

# 5. Démarrer le service
sudo systemctl start medlab
sudo systemctl enable medlab
```

---

## ⚙️ Configuration Production

### Fichier `/opt/medlab/.env`

```bash
# ================================================================
# CONFIGURATION PRODUCTION - HÔPITAL GÉNÉRAL DE DOUALA
# ================================================================

# BASE DE DONNÉES
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medlab
DB_USERNAME=medlab_user
DB_PASSWORD=MotDePasseComplexe2026!

# STOCKAGE LOCAL
UPLOAD_DIR=/var/medlab/data/uploads
WATCH_DIR=/var/medlab/data/incoming
ARCHIVE_DIR=/var/medlab/data/archives
BACKUP_DIR=/var/medlab/backups
RETENTION_DAYS=365
ARCHIVE_ENABLED=true

# SÉCURITÉ (Générer avec: openssl rand -base64 32)
JWT_SECRET=VotreCleSecreteGenereeAvecOpenSSL
JWT_EXPIRATION=28800000  # 8 heures

# EMAIL SMTP HGD
EMAIL_HOST=mail.hgd-douala.cm
EMAIL_PORT=587
EMAIL_USERNAME=laboratoire@hgd-douala.cm
EMAIL_PASSWORD=MotDePasseEmail
EMAIL_FROM=laboratoire@hgd-douala.cm
BASE_URL=https://medlab.hgd-douala.cm

# SERVEUR
SERVER_PORT=8080
```

---

## 🔐 Sécurité

### 1. Chiffrement Disque (Recommandé)
```bash
# Chiffrer le volume de données avec LUKS
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup luksOpen /dev/sdb1 medlab_data
sudo mkfs.ext4 /dev/mapper/medlab_data
sudo mount /dev/mapper/medlab_data /var/medlab
```

### 2. Pare-feu
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (redirect)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### 3. HTTPS avec Nginx
```nginx
# /etc/nginx/sites-available/medlab
server {
    listen 80;
    server_name medlab.hgd-douala.cm;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name medlab.hgd-douala.cm;

    ssl_certificate /etc/ssl/certs/medlab.hgd-douala.cm.crt;
    ssl_certificate_key /etc/ssl/private/medlab.hgd-douala.cm.key;

    location / {
        proxy_pass http://127.0.0.1:4200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
}
```

---

## 💾 Sauvegardes

### Sauvegarde Automatique
- **Fréquence**: Quotidienne à 2h00
- **Contenu**: Fichiers PDF + Base de données
- **Rétention**: 30 jours
- **Format**: tar.gz compressé

### Sauvegarde Manuelle
```bash
# Via l'API (requiert token admin)
curl -X POST https://medlab.hgd-douala.cm/api/storage/backup \
  -H "Authorization: Bearer $TOKEN"

# Via le script
sudo -u medlab /opt/medlab/scripts/backup.sh
```

### Restauration
```bash
# Décompresser la sauvegarde
tar -xzf medlab_backup_20260210_020000.tar.gz

# Restaurer les fichiers
rsync -av medlab_backup_20260210_020000/uploads/ /var/medlab/data/uploads/

# Restaurer la base de données
psql -U medlab_user medlab < medlab_backup_20260210_020000/database.sql
```

---

## 📊 Monitoring du Stockage

### Via l'API
```bash
# Statistiques de stockage
curl https://medlab.hgd-douala.cm/api/storage/stats \
  -H "Authorization: Bearer $TOKEN"

# Réponse:
{
  "uploadsDirPath": "/var/medlab/data/uploads",
  "uploadsDirSizeMB": 1250,
  "totalFiles": 3420,
  "freeSpaceGB": 280,
  "usagePercentage": 44.2,
  "alertLevel": "OK",
  "alertMessage": "Espace disque suffisant."
}
```

### Alertes
| Niveau | Condition | Action |
|--------|-----------|--------|
| **OK** | < 80% utilisé | Aucune |
| **WARNING** | 80-90% utilisé | Planifier extension |
| **CRITICAL** | > 90% utilisé | Action immédiate requise |

---

## 📞 Support

**Contact IT HGD**: it-support@hgd-douala.cm

**Logs de diagnostic**:
```bash
# Logs applicatifs
sudo tail -f /var/log/medlab/medlab.log

# Logs système
sudo journalctl -u medlab -f

# Espace disque
df -h /var/medlab
```

---

## 📜 Conformité

Ce système respecte:
- **Loi n° 2010/013** sur la protection des données personnelles au Cameroun
- **Règles de confidentialité médicale** (secret médical)
- **Normes d'archivage hospitalier** (conservation 10 ans minimum)

---

*Document généré le 10 février 2026 - MedLab v1.0.0*
