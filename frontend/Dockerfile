# Stage 1: Build Angular app
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Build en mode production
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=build /app/dist/medlab-app/browser /usr/share/nginx/html

# Variables d'environnement
ENV API_URL=http://backend:8080

# Exposer le port 80
EXPOSE 80

# Script pour remplacer l'URL de l'API au démarrage
CMD ["nginx", "-g", "daemon off;"]
