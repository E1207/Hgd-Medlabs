# MedLab - Système de Gestion et d'Envoi de Résultats d'Examens Médicaux

## 🏥 Hôpital Général de Douala

Application complète pour la gestion et l'envoi sécurisé de résultats d'examens médicaux.

## 📋 Contenu

- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Stack Technique](#stack-technique)

## 🏗️ Architecture

```
MedLab/
├── backend/          # Spring Boot Application
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/         # Angular Application
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── database/         # SQL Scripts
│   ├── schema.sql
│   └── init-data.sql
└── docker-compose.yml
```

## ✨ Fonctionnalités

### 1. Import de Résultats
- **Import Manuel** : Upload de PDF avec formulaire et extraction automatique des métadonnées
- **Import Automatique** : Scanner automatique d'un répertoire toutes les 10 secondes

### 2. Gestion des Statuts
- IMPORTED : Importé automatiquement, en attente de complétion
- COMPLETED : Formulaire complété
- SENT : Email envoyé au patient
- OPENED : Patient a consulté le PDF

### 3. Envoi Sécurisé
- Email de notification avec lien de consultation
- Code d'accès à 8 caractères envoyé par email
- Protection contre le brute force (5 tentatives max)
- Tracking des accès

### 4. Dashboard Admin
- KPIs : Total résultats, résultats envoyés aujourd'hui, en attente, taux d'ouverture
- Graphiques : Distribution par statut, évolution temporelle
- Derniers résultats traités

### 5. Gestion Utilisateurs
- Rôles : ADMIN, TECHNICIEN
- CRUD complet (Admin uniquement)

## 🔧 Prérequis

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+
- Docker & Docker Compose (optionnel)

## 📦 Installation

### Option 1 : Avec Docker (Recommandé)

```bash
# Cloner le projet
cd /Users/emmanuel/Documents/dev/github/Hgd-Medlabs

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos configurations (notamment EMAIL_*)
nano .env

# Lancer avec Docker Compose
docker-compose up -d
```

L'application sera accessible à :
- Frontend : http://localhost:4200
- Backend API : http://localhost:8080
- Swagger UI : http://localhost:8080/api/swagger-ui.html

### Option 2 : Installation Manuelle

#### Backend

```bash
cd backend

# Compiler le projet
./mvnw clean package

# Créer les répertoires nécessaires
mkdir -p /data/medlab/uploads /data/medlab/incoming

# Créer la base de données PostgreSQL
psql -U postgres
CREATE DATABASE medlab;
CREATE USER medlab WITH PASSWORD 'medlab123';
GRANT ALL PRIVILEGES ON DATABASE medlab TO medlab;
\q

# Initialiser la base de données
psql -U medlab -d medlab < ../database/schema.sql
psql -U medlab -d medlab < ../database/init-data.sql

# Lancer l'application
java -jar target/medlab-1.0.0-SNAPSHOT.jar
```

#### Frontend

```bash
cd frontend

# Installer les dépendances
npm install --legacy-peer-deps

# Lancer en mode développement
npm start
```

## ⚙️ Configuration

### Variables d'Environnement

Éditez le fichier `.env` :

```bash
# Base de données
DB_USERNAME=medlab
DB_PASSWORD=medlab123

# JWT Secret (Changez en production!)
JWT_SECRET=VotreClefSecreteTresLongueEtComplexe

# Répertoires
UPLOAD_DIR=/data/medlab/uploads
WATCH_DIR=/data/medlab/incoming

# Configuration Email (IMPORTANT)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application
EMAIL_FROM=noreply@medlab.hgd.cm

# URL de base (pour les liens dans les emails)
BASE_URL=http://localhost:4200
```

### Configuration Email Gmail

1. Activer l'authentification à 2 facteurs sur votre compte Gmail
2. Générer un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

### Répertoire Surveillé

Le scheduler surveille automatiquement le répertoire `WATCH_DIR` toutes les 10 secondes.

Pour tester l'import automatique :
```bash
# Copier un PDF de test dans le répertoire surveillé
cp test-result.pdf /data/medlab/incoming/

# Le fichier sera automatiquement importé et déplacé vers /data/medlab/incoming/processed/
```

## 🚀 Utilisation

### Comptes par Défaut

Après l'initialisation de la base de données :

- **Administrateur**
  - Email : `admin@medlab.hgd.cm`
  - Mot de passe : `medlab123`

- **Technicien 1**
  - Email : `technicien1@medlab.hgd.cm`
  - Mot de passe : `medlab123`

- **Technicien 2**
  - Email : `technicien2@medlab.hgd.cm`
  - Mot de passe : `medlab123`

### Workflow Complet

1. **Connexion** : Se connecter avec un compte technicien ou admin

2. **Import Manuel** :
   - Aller dans "Nouveau Résultat"
   - Glisser-déposer un PDF ou cliquer pour parcourir
   - Les métadonnées sont extraites automatiquement du PDF
   - Compléter les champs manquants
   - Cliquer sur "Envoyer Résultat"

3. **Import Automatique** :
   - Le système surveille automatiquement le répertoire configuré
   - Les nouveaux PDF sont importés avec le statut "IMPORTÉ"
   - Dans "Historique", cliquer sur les 3 points > "Compléter le dossier"
   - Renseigner les informations du patient
   - Envoyer le résultat

4. **Consultation Patient** :
   - Le patient reçoit un email avec un lien
   - Il clique sur le lien et arrive sur la page publique
   - Il entre le code d'accès reçu par email
   - Il peut consulter et télécharger son PDF

5. **Dashboard** :
   - Vue d'ensemble des statistiques
   - Graphiques de distribution
   - Derniers résultats traités

### Format des PDF

Le système extrait automatiquement les métadonnées suivantes des PDF :
- **Référence** : "Référence: REF-12345" ou "Ref: 12345"
- **Nom** : "Nom: DUPONT" ou "Nom du patient: DUPONT"
- **Prénom** : "Prénom: Jean" ou "First Name: Jean"
- **Date de naissance** : "Date de naissance: 01/01/1990"
- **Email** : Format email standard
- **Téléphone** : Format +237XXXXXXXXX ou 6XXXXXXXX

## 📚 API Documentation

### Swagger UI

Une fois l'application lancée, accédez à la documentation interactive :
- URL : http://localhost:8080/api/swagger-ui.html

### Endpoints Principaux

#### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur connecté

#### Résultats
- `POST /api/results/upload` - Upload manuel
- `PUT /api/results/{id}/complete` - Compléter un résultat
- `POST /api/results/{id}/send` - Envoyer par email
- `GET /api/results` - Liste avec filtres
- `GET /api/results/{id}/pdf` - Télécharger le PDF

#### Dashboard
- `GET /api/dashboard/stats` - Statistiques globales
- `GET /api/dashboard/recent-results` - Résultats récents

#### Accès Public
- `GET /api/public/results/{id}` - Info résultat (sans PDF)
- `POST /api/public/results/{id}/verify` - Vérifier code d'accès
- `GET /api/public/results/{id}/download` - Télécharger PDF

#### Utilisateurs (Admin)
- `GET /api/users` - Liste
- `POST /api/users` - Créer
- `PUT /api/users/{id}` - Modifier
- `DELETE /api/users/{id}` - Supprimer

## 🛠️ Stack Technique

### Backend
- **Framework** : Spring Boot 3.2.2
- **Langage** : Java 17
- **Base de données** : PostgreSQL 16
- **Sécurité** : Spring Security + JWT
- **PDF** : Apache PDFBox 3.0
- **Email** : JavaMailSender
- **Documentation** : Swagger/OpenAPI (SpringDoc)
- **Build** : Maven

### Frontend
- **Framework** : Angular 17
- **UI Library** : Angular Material
- **Graphiques** : Chart.js + ng2-charts
- **State Management** : Services + RxJS
- **Build** : Angular CLI

### DevOps
- **Conteneurisation** : Docker + Docker Compose
- **Orchestration** : Docker Compose
- **CI/CD** : Prêt pour GitHub Actions

## 📁 Structure du Projet

### Backend
```
backend/src/main/java/cm/hgd/medlab/
├── config/           # Configurations (Security, etc.)
├── controller/       # REST Controllers
├── dto/              # Data Transfer Objects
├── exception/        # Gestion des exceptions
├── model/
│   ├── entity/       # Entities JPA
│   └── enums/        # Énumérations
├── repository/       # Repositories JPA
├── scheduler/        # Tâches planifiées
├── security/         # JWT, Filters
└── service/          # Logique métier
```

### Frontend
```
frontend/src/app/
├── components/
│   ├── login/
│   ├── dashboard/
│   ├── results/
│   ├── users/
│   └── public/
├── guards/           # Route guards
├── interceptors/     # HTTP interceptors
├── models/           # TypeScript models
└── services/         # Services Angular
```

## 🔒 Sécurité

- **JWT** : Authentification basée sur des tokens JWT
- **CORS** : Configuration CORS sécurisée
- **BCrypt** : Hachage des mots de passe et codes d'accès
- **HTTPS** : Recommandé en production
- **Rate Limiting** : Protection contre le brute force (5 tentatives)
- **SQL Injection** : Protection par JPA/Hibernate
- **XSS** : Sanitization automatique Angular

## 🧪 Tests

### Backend
```bash
cd backend
./mvnw test
```

### Frontend
```bash
cd frontend
npm test
```

## 📈 Monitoring et Logs

Les logs sont sauvegardés dans :
- Backend : `backend/logs/medlab.log`
- Console Docker : `docker-compose logs -f`

## 🚀 Déploiement en Production

### Checklist Avant Déploiement

1. ✅ Changer le `JWT_SECRET`
2. ✅ Configurer un serveur SMTP de production
3. ✅ Utiliser HTTPS
4. ✅ Configurer un reverse proxy (Nginx)
5. ✅ Mettre en place des backups PostgreSQL
6. ✅ Configurer des volumes persistants
7. ✅ Changer les mots de passe par défaut
8. ✅ Activer les logs de production

### Build Production

```bash
# Backend
cd backend
./mvnw clean package -Pproduction

# Frontend
cd frontend
npm run build -- --configuration production

# Docker
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 Dépannage

### Le scheduler n'importe pas les fichiers
- Vérifier que le répertoire existe et a les bonnes permissions
- Vérifier les logs : `docker-compose logs backend | grep scheduler`

### Les emails ne sont pas envoyés
- Vérifier la configuration SMTP dans `.env`
- Tester la connexion SMTP
- Vérifier les logs d'email dans la console backend

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `.env`

## 📝 Licence

Copyright © 2026 Hôpital Général de Douala

## 👥 Support

Pour toute question ou assistance :
- Email : support@medlab.hgd.cm
- Issues GitHub : [Créer une issue](../../issues)

## 🎯 Roadmap

- [ ] Envoi de SMS via API (Twilio/Nexmo)
- [ ] Notifications Push
- [ ] Export Excel/CSV
- [ ] Multi-langue (FR/EN)
- [ ] Application Mobile
- [ ] Signature électronique des résultats
- [ ] Intégration avec FHIR

---

**Développé avec ❤️ pour l'Hôpital Général de Douala**
