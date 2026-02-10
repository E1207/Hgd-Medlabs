# 🚀 Guide de Déploiement Railway - MedLab HGD

## Architecture sur Railway

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │   Backend   │  │      Frontend       │  │
│  │   (Plugin)  │◄─┤  (Docker)   │  │   (Docker+Nginx)    │  │
│  │             │  │  Java 21    │  │                     │  │
│  └─────────────┘  └──────▲──────┘  └──────────┬──────────┘  │
│                          │                     │             │
│                          └─────────────────────┘             │
│                              API calls                       │
└─────────────────────────────────────────────────────────────┘
```

## Prérequis

1. Compte Railway (https://railway.app)
2. GitHub repository avec le code MedLab
3. Compte Gmail avec App Password pour les emails

---

## Étape 1: Créer un nouveau projet Railway

1. Allez sur https://railway.app/dashboard
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Empty Project"**

---

## Étape 2: Ajouter PostgreSQL

1. Dans votre projet, cliquez sur **"+ New"**
2. Sélectionnez **"Database" → "Add PostgreSQL"**
3. Railway crée automatiquement la base de données
4. Cliquez sur PostgreSQL et notez les variables:
   - `DATABASE_URL`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGHOST`
   - `PGPORT`

---

## Étape 3: Déployer le Backend

### 3.1 Ajouter le service Backend

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. Sélectionnez votre repo `Hgd-Medlabs`
3. Railway détecte automatiquement le Dockerfile

### 3.2 Configurer le Root Directory

1. Allez dans **Settings** du service
2. Définir **Root Directory**: `backend`

### 3.3 Ajouter les Variables d'Environnement

Cliquez sur **"Variables"** et ajoutez:

```env
# Base de données (référencer le service PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_USERNAME=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}

# Profil Spring Boot
SPRING_PROFILES_ACTIVE=prod

# Sécurité (IMPORTANT: générer des valeurs sécurisées!)
JWT_SECRET=votre_cle_jwt_secrete_minimum_32_caracteres_aleatoires
ENCRYPTION_KEY=votre_cle_encryption_aes256_minimum_32_caracteres

# Email Gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_app_password_gmail
EMAIL_FROM=votre_email@gmail.com

# URL Frontend (à mettre à jour après déploiement frontend)
FRONTEND_URL=https://votre-frontend.railway.app

# CORS (à mettre à jour après déploiement frontend)
CORS_ALLOWED_ORIGINS=https://votre-frontend.railway.app
```

### 3.4 Générer les clés sécurisées

Pour générer une clé sécurisée, exécutez:
```bash
# JWT Secret (Base64)
openssl rand -base64 32

# Encryption Key
openssl rand -hex 16
```

---

## Étape 4: Déployer le Frontend

### 4.1 Ajouter le service Frontend

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. Sélectionnez le même repo `Hgd-Medlabs`

### 4.2 Configurer le Root Directory

1. Allez dans **Settings** du service
2. Définir **Root Directory**: `frontend`

### 4.3 Variables d'Environnement Frontend

```env
# URL du backend pour le proxy nginx
BACKEND_URL=https://votre-backend.railway.app
```

---

## Étape 5: Configurer les Domaines

### 5.1 Backend
1. Allez dans **Settings** → **Networking**
2. Cliquez sur **"Generate Domain"**
3. Notez l'URL: `https://xxx-backend.railway.app`

### 5.2 Frontend
1. Allez dans **Settings** → **Networking**
2. Cliquez sur **"Generate Domain"**
3. Notez l'URL: `https://xxx-frontend.railway.app`

---

## Étape 6: Mettre à jour les Variables Croisées

### Backend - Mettre à jour CORS et FRONTEND_URL
```env
FRONTEND_URL=https://xxx-frontend.railway.app
CORS_ALLOWED_ORIGINS=https://xxx-frontend.railway.app
```

### Frontend - Mettre à jour BACKEND_URL
```env
BACKEND_URL=https://xxx-backend.railway.app
```

---

## Étape 7: Initialiser la Base de Données

La base est créée automatiquement par Hibernate grâce à `ddl-auto: update`.

Pour ajouter l'admin par défaut, connectez-vous à PostgreSQL via Railway:

1. Cliquez sur le service PostgreSQL
2. Allez dans l'onglet **"Data"**
3. Exécutez le script SQL:

```sql
-- Créer l'utilisateur admin
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'admin@medlab.hgd.cm',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqE6LqZxNfJ3YdOxjqE6WT1FPrSYu',  -- medlab123
    'Admin',
    'MedLab',
    'ADMIN',
    true,
    NOW()
);
```

---

## Variables d'Environnement Complètes

### Backend (application-prod.yml)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `DATABASE_USERNAME` | Utilisateur DB | `postgres` |
| `DATABASE_PASSWORD` | Mot de passe DB | `***` |
| `JWT_SECRET` | Clé JWT (32+ chars) | `abc123...` |
| `ENCRYPTION_KEY` | Clé AES-256 (32+ chars) | `xyz789...` |
| `MAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP | `587` |
| `MAIL_USERNAME` | Email SMTP | `email@gmail.com` |
| `MAIL_PASSWORD` | App Password Gmail | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | Email expéditeur | `email@gmail.com` |
| `FRONTEND_URL` | URL du frontend | `https://xxx.railway.app` |
| `CORS_ALLOWED_ORIGINS` | Origines CORS | `https://xxx.railway.app` |

---

## Vérification du Déploiement

### 1. Vérifier le Backend
```bash
curl https://votre-backend.railway.app/actuator/health
# Réponse attendue: {"status":"UP"}
```

### 2. Vérifier le Frontend
Ouvrez `https://votre-frontend.railway.app` dans le navigateur.

### 3. Tester l'authentification
```bash
curl -X POST https://votre-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medlab.hgd.cm","password":"medlab123"}'
```

---

## Dépannage

### Le backend ne démarre pas
- Vérifiez les logs dans Railway
- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que le profil `prod` est actif

### Erreur CORS
- Vérifiez que `CORS_ALLOWED_ORIGINS` contient l'URL exacte du frontend
- L'URL ne doit pas avoir de slash final

### Emails ne s'envoient pas
- Vérifiez que l'App Password Gmail est correct
- Vérifiez que "Less secure app access" est désactivé
- Utilisez un App Password, pas le mot de passe Gmail

### PDFs ne s'affichent pas
- Vérifiez que `ENCRYPTION_KEY` est la même qu'en développement
- Si différente, les anciens PDFs ne pourront pas être déchiffrés

---

## Coûts Railway (Estimation)

| Service | Usage | Coût estimé/mois |
|---------|-------|------------------|
| PostgreSQL | 1GB | ~$5 |
| Backend | 512MB RAM | ~$5 |
| Frontend | 256MB RAM | ~$3 |
| **Total** | | **~$13/mois** |

Railway offre $5 de crédit gratuit par mois.

---

## Maintenance

### Sauvegardes PostgreSQL
Railway propose des backups automatiques sur les plans payants.

### Logs
Accessibles dans l'onglet **"Logs"** de chaque service.

### Mise à jour
Chaque push sur GitHub déclenche un redéploiement automatique.
