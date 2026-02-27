# 🚀 Guide de Déploiement MedLab HGD

## Options de Déploiement

| Option | Services | Coût | Complexité |
|--------|----------|------|------------|
| **Option A** | Supabase + Render + Vercel | Gratuit | Moyenne |
| **Option B** | Railway (tout-en-un) | ~$5/mois | Simple |
| **Option C** | Fly.io + Vercel | ~$5/mois | Moyenne |

---

## 📋 Prérequis

- Compte GitHub avec le repo MedLab
- Compte email SMTP configuré (Gmail, Brevo, etc.)
- Environ 15-30 minutes

---

## Option A : Supabase + Render + Vercel (100% Gratuit)

### Étape 1: Base de données PostgreSQL (Supabase)

1. **Créer un compte** : https://supabase.com
2. **Nouveau projet** : 
   - Nom: `medlab-hgd`
   - Mot de passe DB: (notez-le!)
   - Région: Europe West (Frankfurt)
3. **Récupérer l'URL de connexion** :
   - Settings → Database → Connection string → URI
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

4. **Initialiser le schéma** :
   - Aller dans SQL Editor
   - Copier/coller le contenu de `database/schema.sql`
   - Exécuter

### Étape 2: Backend Spring Boot (Render)

1. **Créer un compte** : https://render.com
2. **New → Web Service**
3. **Connecter GitHub** et sélectionner `Hgd-Medlabs`
4. **Configuration** :
   - Name: `medlab-backend`
   - Region: Frankfurt
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: Docker
   - Dockerfile Path: `Dockerfile.prod`

5. **Variables d'environnement** :
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   JWT_SECRET=[Générer: openssl rand -hex 32]
   ENCRYPTION_KEY=[Générer: openssl rand -base64 32]
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=votre-email@gmail.com
   MAIL_PASSWORD=votre-app-password
   CORS_ALLOWED_ORIGINS=https://medlab-hgd.vercel.app
   ```

6. **Créer le service** (déploiement automatique)

### Étape 3: Frontend Angular (Vercel)

1. **Créer un compte** : https://vercel.com
2. **Import Project** depuis GitHub
3. **Sélectionner** `Hgd-Medlabs`
4. **Configuration** :
   - Framework: Other
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist/medlab-app/browser`

5. **Variables d'environnement** :
   ```
   BACKEND_URL=https://medlab-backend.onrender.com
   ```

6. **Déployer**

### Étape 4: Mise à jour CORS

Après déploiement de Vercel, récupérez l'URL (ex: `https://medlab-hgd.vercel.app`) et mettez à jour `CORS_ALLOWED_ORIGINS` sur Render.

---

## Option B : Railway (Tout-en-un) ⭐ RECOMMANDÉ

Railway permet de déployer PostgreSQL + Backend + Frontend sur la même plateforme.

### Étape 1: Créer le projet

1. **Créer un compte** : https://railway.app
2. **New Project → Deploy from GitHub**
3. **Sélectionner** `Hgd-Medlabs`

### Étape 2: Ajouter PostgreSQL

1. **New → Database → PostgreSQL**
2. Railway crée automatiquement la variable `DATABASE_URL`

### Étape 3: Configurer le Backend

1. **New → GitHub Repo** (sélectionner le même repo)
2. **Settings** :
   - Root Directory: `/backend`
   - Start Command: `java -jar target/medlab-1.0.0-SNAPSHOT.jar`
   - Watch Paths: `/backend/**`

3. **Variables** (dans l'onglet Variables):
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=[Générer]
   ENCRYPTION_KEY=[Générer]
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=votre-email
   MAIL_PASSWORD=votre-app-password
   PORT=8080
   ```

4. **Générer un domaine** : Settings → Networking → Generate Domain

### Étape 4: Configurer le Frontend

1. **New → GitHub Repo** (même repo)
2. **Settings** :
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve dist/medlab-app/browser -l $PORT`
   - Watch Paths: `/frontend/**`

3. **Variables** :
   ```
   BACKEND_URL=https://[votre-backend].railway.app
   ```

4. **Générer un domaine**

### Étape 5: Initialiser la base de données

1. Cliquer sur le service PostgreSQL
2. Aller dans l'onglet **Data**
3. Exécuter le contenu de `database/schema.sql`

---

## 🔐 Sécurité Post-Déploiement

### Checklist obligatoire

- [ ] Changer le mot de passe admin par défaut
- [ ] Vérifier que HTTPS est actif partout
- [ ] Tester l'envoi d'emails
- [ ] Vérifier les logs pour erreurs
- [ ] Configurer les alertes de monitoring

### Variables sensibles à ne JAMAIS exposer

- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DATABASE_URL`
- `MAIL_PASSWORD`

---

## 🧪 Tests Post-Déploiement

```bash
# Tester le backend
curl https://[VOTRE_BACKEND]/actuator/health

# Tester la connexion
curl -X POST https://[VOTRE_BACKEND]/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medlab.hgd.cm","password":"medlab123"}'
```

---

## 📊 Monitoring

### Render
- Dashboard → Logs en temps réel
- Métriques CPU/RAM incluses

### Railway
- Dashboard → Observability
- Logs et métriques intégrés

### Vercel
- Analytics intégrés
- Logs de build

---

## 🆘 Dépannage

### Le backend ne démarre pas
- Vérifier les logs pour les erreurs de connexion DB
- S'assurer que DATABASE_URL est correcte
- Vérifier que le port correspond (8080)

### Erreur CORS
- Mettre à jour `CORS_ALLOWED_ORIGINS` avec l'URL exacte du frontend
- Redémarrer le backend après modification

### L'email ne fonctionne pas
- Vérifier les identifiants SMTP
- Pour Gmail, utiliser un App Password (pas le mot de passe normal)
- Activer "Less secure apps" ou utiliser OAuth2

---

## 📝 Commandes utiles

```bash
# Générer JWT_SECRET
openssl rand -hex 32

# Générer ENCRYPTION_KEY
openssl rand -base64 32

# Build local du backend
cd backend && mvn clean package -DskipTests

# Build local du frontend
cd frontend && npm run build
```
