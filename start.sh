#!/bin/bash

echo "========================================"
echo "     DiplomaVerif - Démarrage Rapide"
echo "========================================"
echo ""

# Vérification des fichiers nécessaires
if [ ! -f "package.json" ]; then
    echo "[ERREUR] Fichier package.json introuvable"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "[AVERTISSEMENT] Fichier .env introuvable"
    echo "Veuillez créer un fichier .env avec les configurations nécessaires"
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
fi

echo "[INFO] Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERREUR] L'installation a échoué"
    exit 1
fi

echo ""
echo "[INFO] Génération du client Prisma..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo "[ERREUR] La génération a échoué"
    exit 1
fi

echo ""
echo "[INFO] Application des migrations..."
npm run prisma:migrate
if [ $? -ne 0 ]; then
    echo "[ERREUR] Les migrations ont échoué"
    exit 1
fi

echo ""
echo "[INFO] Peuplement de la base de données..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo "[AVERTISSEMENT] Le seed a échoué (base peut-être déjà peuplée)"
fi

echo ""
echo "[SUCCÈS] Configuration terminée!"
echo ""
echo "[INFO] Démarrage du serveur..."
echo ""
npm run dev

