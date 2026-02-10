#!/bin/sh
set -e

# Remplacer l'URL de l'API dans les fichiers JavaScript buildés
# La variable API_URL doit être définie dans Railway
if [ -n "$API_URL" ]; then
    echo "Configuring API URL: $API_URL"
    # Remplacer /api par l'URL complète du backend
    find /usr/share/nginx/html -name '*.js' -exec sed -i "s|/api|$API_URL/api|g" {} \;
fi

# Exécuter la commande passée en argument (nginx)
exec "$@"
