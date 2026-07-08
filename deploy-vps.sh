#!/bin/bash

# Script de déploiement du backend API et de la base de données PostgreSQL dédiée
# Cible : VPS Production 176.31.163.141

set -e

VPS_IP="188.165.53.185"
VPS_USER="ubuntu"
DEST_DIR="/home/ubuntu/medical-sylow"

echo "============================================="
echo "📤  Phase 1 : Envoi du code sur le VPS..."
echo "============================================="
echo "Copie des fichiers vers $VPS_USER@$VPS_IP:$DEST_DIR..."

# Créer le dossier de destination sur le VPS si besoin
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "mkdir -p $DEST_DIR"

# Envoyer le code via rsync (en excluant node_modules, cache Next, etc.)
rsync -av --progress -e "ssh -o StrictHostKeyChecking=no" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='out' \
  --exclude='.env.local' \
  --exclude='playwright-report' \
  --exclude='test-results' \
  ./ "$VPS_USER@$VPS_IP:$DEST_DIR/"

echo "============================================="
echo "🚀  Phase 2 : Lancement des conteneurs sur le VPS..."
echo "============================================="

# Démarrer les conteneurs de production
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "cd $DEST_DIR && docker compose -f docker-compose.prod.yml up -d --build"

echo "============================================="
echo "🎉  Déploiement VPS terminé avec succès !"
echo "============================================="
echo "Le backend de production et la base PostgreSQL dédiée tournent sur le port 3005 de votre VPS."
echo "Il ne vous reste plus qu'à configurer votre reverse proxy HTTPS (ex: avec nginx.prod.conf) pour exposer l'URL."
