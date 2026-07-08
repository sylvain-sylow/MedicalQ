#!/bin/bash

# Script de build et de déploiement FTP pour le module de sélection médicale
# Cible : www.cormarin.com
# Hébergement : OVH (ftp.cluster121.hosting.ovh.net)

set -e

# Configuration FTP
FTP_HOST="ftp.cluster121.hosting.ovh.net"
FTP_USER="cormarinid"
FTP_PASS="Sabenal!OVH!1"
REMOTE_DIR="/" # Racine du site

# URL de l'API backend de production (HDS / PostgreSQL dédié)
# Par défaut, on utilise l'URL locale ou celle configurée
DEFAULT_API_URL="http://localhost:3005"
read -p "Entrez l'URL publique de votre API de base de données [$DEFAULT_API_URL] : " API_URL
API_URL=${API_URL:-$DEFAULT_API_URL}

echo "============================================="
echo "🛠️  Phase 1 : Compilation de l'export statique"
echo "============================================="
echo "API URL : $API_URL"

# Définir la variable d'environnement pour le build Next.js
export NEXT_PUBLIC_API_URL="$API_URL"

# Lancer le build statique Next.js
# Note : Nous activons l'export statique via la variable NEXT_STATIC_EXPORT
NEXT_STATIC_EXPORT=true npx next build

echo "============================================="
echo "📤  Phase 2 : Déploiement FTP vers OVH"
echo "============================================="
echo "Connexion à ftp://$FTP_USER@$FTP_HOST$REMOTE_DIR..."

if [ ! -d "out" ]; then
    echo "❌ Erreur : Le dossier d'export 'out' n'existe pas. Le build a échoué."
    exit 1
fi

# Parcourir et téléverser récursivement tous les fichiers du dossier 'out'
cd out
find . -type f | while read -r file; do
    # Retirer le './' initial du chemin du fichier
    clean_path="${file#./}"
    echo "Uploader : $clean_path ..."
    # Utiliser curl pour créer les dossiers distants si nécessaire et téléverser le fichier
    curl --ftp-create-dirs -T "$clean_path" -u "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$REMOTE_DIR$clean_path" --silent
done

echo "============================================="
echo "🎉  Déploiement terminé avec succès !"
echo "============================================="
echo "Le module de sélection médicale est maintenant en ligne sur www.cormarin.com"
echo "API Backend connectée : $API_URL"
