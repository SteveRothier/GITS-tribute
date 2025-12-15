# GITS - Ghost in the Shell: First Assault Online Tribute

Un hommage interactif au jeu **Ghost in the Shell: Stand Alone Complex - First Assault Online**, présentant une interface cyberpunk immersive avec visualisation 3D des modules, gestion d'armurerie, et exploration des opérateurs de la Section 9.

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)

## 🎯 Description

Ce projet est une application web interactive qui rend hommage au jeu **First Assault Online** (2016-2017). Il propose une expérience immersive avec :

- **Globe 3D interactif** : Visualisation des modules via Three.js avec animations et connexions réseau
- **Module Armurerie** : Gestion complète des armes et attachments avec prévisualisation 3D
- **Module Opérateurs** : Exploration des personnages de la Section 9 avec leurs capacités et skins
- **Module Cartes** : Affichage des maps du jeu avec layouts et vues visuelles
- **Module Musique** : Lecteur audio pour la bande sonore du jeu
- **Module Média** : Lecteur vidéo pour le trailer officiel
- **Module À Propos** : Informations sur le jeu, son histoire et sa chronologie

## 🚀 Technologies

- **React 19.1.1** - Bibliothèque UI
- **TypeScript 5.9.3** - Typage statique
- **Vite 7.1.7** - Build tool et dev server
- **Three.js 0.181.0** - Rendu 3D pour le globe interactif
- **GSAP 3.13.0** - Animations avancées

## 📁 Structure du Projet

```
src/
├── components/
│   ├── Dashboard.tsx          # Composant principal avec globe 3D
│   ├── LoadingScreen.tsx      # Écran de chargement avec séquence boot
│   ├── NetworkGlobe.tsx       # Globe 3D interactif (Three.js)
│   └── modules/
│       ├── AboutModule.tsx    # Informations sur le jeu
│       ├── ArmoryModule.tsx   # Gestion des armes et attachments
│       ├── CharacterModule.tsx # Exploration des opérateurs
│       ├── MapsModule.tsx     # Cartes du jeu
│       ├── MediaHubModule.tsx # Lecteur vidéo
│       └── MusicModule.tsx    # Lecteur audio
├── data/
│   ├── attachments.ts        # Données des attachments
│   ├── characters.ts         # Données des opérateurs
│   ├── maps.ts               # Données des cartes
│   ├── music.ts              # Données des musiques
│   └── weapons.ts            # Données des armes
└── hooks/
    └── useResponsive.ts      # Hook pour le responsive design
```

## 🛠️ Installation

### Prérequis

- **Node.js** 18+ et **npm** ou **yarn**

### Étapes

1. **Cloner le dépôt** (si applicable)
   ```bash
   git clone <repository-url>
   cd gits
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:5173
   ```

## 📦 Scripts Disponibles

- `npm run dev` - Lance le serveur de développement Vite
- `npm run build` - Compile le projet pour la production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Vérifie le code avec ESLint

## 🎮 Fonctionnalités

### Dashboard Principal
- **Globe 3D interactif** avec nodes représentant les modules
- **Animations fluides** avec connexions réseau animées
- **Navigation intuitive** par clic ou survol
- **Design responsive** adapté à tous les écrans

### Module Armurerie
- **Catalogue complet** des armes (Primary, Secondary, Melee, Throwable)
- **Système d'attachments** avec prévisualisation 3D
- **Calcul des statistiques** modifiées par les attachments
- **Filtrage et tri** par catégorie, type et prix
- **Preview détaillé** avec stats, skins et attachments compatibles

### Module Opérateurs
- **Carrousel interactif** des personnages de la Section 9
- **Profils détaillés** avec capacités et descriptions
- **Système de skins** avec prévisualisation
- **Navigation fluide** avec animations synchronisées

### Module Cartes
- **Grille responsive** des maps du jeu
- **Vues détaillées** avec layout et aspect visuel
- **Modes de jeu** associés à chaque carte
- **Expansion animée** lors de la sélection

### Module Musique
- **Lecteur audio** avec contrôles complets
- **Filtrage par catégorie** (Menu, Combat, Ambient, Theme)
- **Player fixe** en bas de l'écran
- **Sauvegarde du volume** dans localStorage

### Module Média
- **Lecteur vidéo** pour le trailer officiel
- **Contrôles adaptatifs** (desktop/mobile)
- **Barre de progression** interactive
- **Gestion du volume** avec sauvegarde

### Module À Propos
- **Informations complètes** sur le jeu
- **Chronologie** du développement
- **Modes de jeu** classiques et expérimentaux
- **Contexte et lore** de l'univers

## 🎨 Design

Le projet utilise un design **cyberpunk** cohérent avec l'univers Ghost in the Shell :

- **Palette de couleurs** : Cyan (#00d4ff), Rose/Rouge (#ff0066), Jaune (#ffff00), Violet (#9966ff), Orange (#ff6600)
- **Typographie** : Monospace (Courier New) pour l'esthétique terminal
- **Effets visuels** : Scanlines, glows, animations fluides
- **Scrollbars personnalisées** adaptées à chaque module

## 📱 Responsive Design

L'application est entièrement responsive avec adaptation pour :

- **Desktop** : Expérience complète avec toutes les fonctionnalités
- **Tablette** : Layout adapté avec optimisations
- **Mobile** : Interface simplifiée et optimisée pour le tactile
- **Petits écrans** : Grilles et tailles ajustées automatiquement

## 🔧 Architecture

### Optimisations

- **Lazy loading** des modules pour améliorer les performances
- **Mémorisation** (useMemo, useCallback) pour éviter les re-renders inutiles
- **Code modulaire** avec extraction de composants réutilisables
- **Types TypeScript** stricts pour la sécurité du code
- **Documentation JSDoc** complète pour la maintenabilité

### Gestion d'État

- **React Hooks** (useState, useEffect, useRef, useMemo, useCallback)
- **État local** pour chaque module
- **localStorage** pour la persistance des préférences (volume, etc.)

## 📝 Notes

- Ce projet est un **hommage non-officiel** au jeu First Assault Online
- Tous les contenus (images, musiques, vidéos) sont la propriété de leurs détenteurs respectifs
- Le projet utilise des données extraites et organisées du jeu original

## 🎯 Avertissement

⚠️ **CLASSIFIED SYSTEM - AUTHORIZED PERSONNEL ONLY** ⚠️

Ce projet est une création fan-made et n'est pas affilié à Kodansha, Production I.G., ou Nexon America.

## 📄 Licence

Ce projet est un hommage éducatif et non-commercial. Tous les droits appartiennent à leurs propriétaires respectifs.

---

**Développé avec nostalgie en hommage à Ghost in the Shell: First Assault Online**
