#!/bin/bash
# ================================================================
# Script d'installation - MedLab HGD
# Hôpital Général de Douala
# ================================================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       INSTALLATION MEDLAB - HÔPITAL GÉNÉRAL DE DOUALA      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ========================
# CONFIGURATION
# ========================
INSTALL_DIR="/opt/medlab"
DATA_DIR="/var/medlab/data"
LOG_DIR="/var/log/medlab"
BACKUP_DIR="/var/medlab/backups"
MEDLAB_USER="medlab"
MEDLAB_GROUP="medlab"

# ========================
# VÉRIFICATIONS
# ========================
echo "[1/8] Vérification des prérequis..."

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

# Vérifier Java 21
if ! command -v java &> /dev/null; then
    echo "❌ Java n'est pas installé"
    echo "   Installer Java 21: sudo apt install openjdk-21-jdk"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 21 ]; then
    echo "❌ Java 21 ou supérieur requis (version actuelle: $JAVA_VERSION)"
    exit 1
fi
echo "   ✅ Java $JAVA_VERSION détecté"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL n'est pas installé"
    echo "   Installer PostgreSQL: sudo apt install postgresql"
    exit 1
fi
echo "   ✅ PostgreSQL détecté"

# ========================
# CRÉATION DES RÉPERTOIRES
# ========================
echo ""
echo "[2/8] Création des répertoires..."

# Créer le groupe et l'utilisateur medlab
if ! getent group $MEDLAB_GROUP > /dev/null; then
    groupadd $MEDLAB_GROUP
    echo "   ✅ Groupe $MEDLAB_GROUP créé"
fi

if ! getent passwd $MEDLAB_USER > /dev/null; then
    useradd -r -g $MEDLAB_GROUP -d $INSTALL_DIR -s /bin/false $MEDLAB_USER
    echo "   ✅ Utilisateur $MEDLAB_USER créé"
fi

# Créer les répertoires
mkdir -p $INSTALL_DIR
mkdir -p $DATA_DIR/{uploads,incoming,processed,error,archives}
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR

# Définir les permissions
chown -R $MEDLAB_USER:$MEDLAB_GROUP $INSTALL_DIR
chown -R $MEDLAB_USER:$MEDLAB_GROUP $DATA_DIR
chown -R $MEDLAB_USER:$MEDLAB_GROUP $BACKUP_DIR
chown -R $MEDLAB_USER:$MEDLAB_GROUP $LOG_DIR

chmod 750 $DATA_DIR
chmod 750 $BACKUP_DIR
chmod 750 $LOG_DIR

echo "   ✅ Répertoires créés avec permissions sécurisées"

# ========================
# COPIE DES FICHIERS
# ========================
echo ""
echo "[3/8] Copie des fichiers application..."

if [ -f "backend/target/medlab-1.0.0-SNAPSHOT.jar" ]; then
    cp backend/target/medlab-1.0.0-SNAPSHOT.jar $INSTALL_DIR/medlab.jar
    chown $MEDLAB_USER:$MEDLAB_GROUP $INSTALL_DIR/medlab.jar
    chmod 750 $INSTALL_DIR/medlab.jar
    echo "   ✅ Application JAR copiée"
else
    echo "   ⚠️  Fichier JAR non trouvé. Compilez d'abord avec: mvn clean package"
fi

# ========================
# CONFIGURATION
# ========================
echo ""
echo "[4/8] Création du fichier de configuration..."

if [ ! -f "$INSTALL_DIR/.env" ]; then
    cat > $INSTALL_DIR/.env << 'EOF'
# ================================================================
# CONFIGURATION PRODUCTION - HÔPITAL GÉNÉRAL DE DOUALA
# MedLab - Système de Gestion des Résultats de Laboratoire
# ================================================================

# BASE DE DONNÉES
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medlab
DB_USERNAME=medlab_user
DB_PASSWORD=CHANGER_MOT_DE_PASSE

# STOCKAGE LOCAL
UPLOAD_DIR=/var/medlab/data/uploads
WATCH_DIR=/var/medlab/data/incoming
ARCHIVE_DIR=/var/medlab/data/archives
BACKUP_DIR=/var/medlab/backups
RETENTION_DAYS=365
ARCHIVE_ENABLED=true

# SÉCURITÉ (GÉNÉRER UNE NOUVELLE CLÉ!)
JWT_SECRET=GENERER_NOUVELLE_CLE_AVEC_openssl_rand_-base64_32
JWT_EXPIRATION=28800000

# EMAIL
EMAIL_HOST=smtp.hgd-douala.cm
EMAIL_PORT=587
EMAIL_USERNAME=laboratoire@hgd-douala.cm
EMAIL_PASSWORD=MOT_DE_PASSE_EMAIL
EMAIL_FROM=laboratoire@hgd-douala.cm
BASE_URL=https://medlab.hgd-douala.cm

# SERVEUR
SERVER_PORT=8080

# LOGS
LOG_DIR=/var/log/medlab
EOF

    chown $MEDLAB_USER:$MEDLAB_GROUP $INSTALL_DIR/.env
    chmod 600 $INSTALL_DIR/.env
    echo "   ✅ Fichier .env créé"
    echo "   ⚠️  IMPORTANT: Modifier les mots de passe dans $INSTALL_DIR/.env"
else
    echo "   ℹ️  Fichier .env existant conservé"
fi

# ========================
# SERVICE SYSTEMD
# ========================
echo ""
echo "[5/8] Configuration du service systemd..."

cat > /etc/systemd/system/medlab.service << EOF
[Unit]
Description=MedLab - Système de Gestion des Résultats de Laboratoire
Documentation=https://github.com/hgd-douala/medlab
After=network.target postgresql.service

[Service]
Type=simple
User=$MEDLAB_USER
Group=$MEDLAB_GROUP
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env

# Commande de démarrage
ExecStart=/usr/bin/java -Xms512m -Xmx2g \\
    -Dspring.datasource.url=jdbc:postgresql://\${DB_HOST}:\${DB_PORT}/\${DB_NAME} \\
    -Dspring.datasource.username=\${DB_USERNAME} \\
    -Dspring.datasource.password=\${DB_PASSWORD} \\
    -Dmedlab.file.upload-dir=\${UPLOAD_DIR} \\
    -Dmedlab.file.watch-dir=\${WATCH_DIR} \\
    -Dmedlab.storage.archive-dir=\${ARCHIVE_DIR} \\
    -Dmedlab.storage.backup-dir=\${BACKUP_DIR} \\
    -Dmedlab.security.jwt-secret=\${JWT_SECRET} \\
    -Dspring.mail.host=\${EMAIL_HOST} \\
    -Dspring.mail.port=\${EMAIL_PORT} \\
    -Dspring.mail.username=\${EMAIL_USERNAME} \\
    -Dspring.mail.password=\${EMAIL_PASSWORD} \\
    -Dmedlab.email.from=\${EMAIL_FROM} \\
    -Dmedlab.email.base-url=\${BASE_URL} \\
    -Dlogging.file.name=\${LOG_DIR}/medlab.log \\
    -jar medlab.jar

# Redémarrage automatique
Restart=on-failure
RestartSec=10

# Sécurité
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR $LOG_DIR $BACKUP_DIR

# Limites
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "   ✅ Service systemd configuré"

# ========================
# SAUVEGARDE AUTOMATIQUE
# ========================
echo ""
echo "[6/8] Configuration des sauvegardes automatiques..."

cat > /etc/cron.d/medlab-backup << 'EOF'
# Sauvegarde quotidienne des données MedLab à 2h00
0 2 * * * medlab /opt/medlab/scripts/backup.sh >> /var/log/medlab/backup.log 2>&1

# Nettoyage des anciennes sauvegardes (> 30 jours)
0 3 * * 0 medlab find /var/medlab/backups -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null
EOF

# Script de sauvegarde
mkdir -p $INSTALL_DIR/scripts
cat > $INSTALL_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash
# Script de sauvegarde MedLab

BACKUP_DIR="/var/medlab/backups"
DATA_DIR="/var/medlab/data"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="medlab_backup_$DATE"

echo "=== Sauvegarde MedLab - $(date) ==="

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Sauvegarder les fichiers PDF
echo "Sauvegarde des fichiers PDF..."
rsync -av --progress "$DATA_DIR/uploads/" "$BACKUP_DIR/$BACKUP_NAME/uploads/"

# Sauvegarder la base de données
echo "Sauvegarde de la base de données..."
pg_dump -h localhost -U medlab_user medlab > "$BACKUP_DIR/$BACKUP_NAME/database.sql"

# Compresser
echo "Compression..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

echo "Sauvegarde terminée: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "Taille: $(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)"
EOF

chmod +x $INSTALL_DIR/scripts/backup.sh
chown -R $MEDLAB_USER:$MEDLAB_GROUP $INSTALL_DIR/scripts

echo "   ✅ Sauvegardes automatiques configurées (tous les jours à 2h00)"

# ========================
# BASE DE DONNÉES
# ========================
echo ""
echo "[7/8] Configuration de la base de données..."

echo "   Exécutez les commandes suivantes pour créer la base de données:"
echo ""
echo "   sudo -u postgres psql"
echo "   CREATE USER medlab_user WITH PASSWORD 'VOTRE_MOT_DE_PASSE';"
echo "   CREATE DATABASE medlab OWNER medlab_user;"
echo "   GRANT ALL PRIVILEGES ON DATABASE medlab TO medlab_user;"
echo "   \\q"
echo ""

# ========================
# FINALISATION
# ========================
echo ""
echo "[8/8] Finalisation..."

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    INSTALLATION TERMINÉE                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo ""
echo "1. Modifier le fichier de configuration:"
echo "   sudo nano $INSTALL_DIR/.env"
echo ""
echo "2. Créer la base de données PostgreSQL (voir commandes ci-dessus)"
echo ""
echo "3. Démarrer le service:"
echo "   sudo systemctl start medlab"
echo "   sudo systemctl enable medlab"
echo ""
echo "4. Vérifier le statut:"
echo "   sudo systemctl status medlab"
echo "   sudo journalctl -u medlab -f"
echo ""
echo "📁 STRUCTURE DES FICHIERS:"
echo "   Application: $INSTALL_DIR/medlab.jar"
echo "   Configuration: $INSTALL_DIR/.env"
echo "   Données: $DATA_DIR/"
echo "   Logs: $LOG_DIR/"
echo "   Sauvegardes: $BACKUP_DIR/"
echo ""
echo "🔐 SÉCURITÉ:"
echo "   - Changez les mots de passe par défaut"
echo "   - Générez une nouvelle clé JWT: openssl rand -base64 32"
echo "   - Configurez un pare-feu (UFW/iptables)"
echo "   - Configurez HTTPS avec un reverse proxy (Nginx)"
echo ""
