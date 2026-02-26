# ===== ÉTAPE 1 : CONSTRUCTION =====
# Utilise une image légère Node.js (Alpine = plus petit ~150MB vs 900MB)
FROM node:20-alpine AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier package.json et package-lock.json (s'il existe)
COPY package*.json ./

# Copier le dossier Prisma (nécessaire pour les migrations DB)
COPY prisma ./prisma/

# Installer toutes les dépendances du projet
RUN npm install

# Copier tout le code source
COPY . .

# Générer le client Prisma (ORM pour accéder à la DB)
RUN npx prisma generate

# Compiler le code TypeScript en JavaScript
RUN npm run build

# ===== ÉTAPE 2 : EXÉCUTION (image finale) =====
# Nouvelle image légère pour réduire la taille finale
FROM node:20-alpine

# Répertoire de travail dans la nouvelle image
WORKDIR /app

# Copier UNIQUEMENT les fichiers nécessaires de l'étape de construction
# (évite de copier les sources TypeScript, dépendances de dev, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Exposer le port 3000 (accessible depuis l'extérieur du conteneur)
EXPOSE 3000

# Commande pour lancer l'app au démarrage du conteneur
# start:prod exécute: node dist/server.js
CMD ["npm", "run", "start:prod"]