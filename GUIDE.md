# Guide d'installation et de démarrage — BNS Stock Manager

Guide étape par étape pour installer et lancer l'application sur un PC Windows.

---

## Étape 1 — Installer Node.js

1. Télécharger Node.js (version 18 ou supérieure) : https://nodejs.org
2. Lancer l'installateur et suivre les étapes (options par défaut).
3. Vérifier l'installation dans un terminal :

```bash
node -v
npm -v
```

Les deux commandes doivent afficher un numéro de version.

---

## Étape 2 — Ouvrir un terminal dans le dossier du projet

Ouvrir un terminal (cmd, PowerShell ou Git Bash) dans le dossier `BNS-Stock` :

```bash
cd BNS-Stock
```

---

## Étape 3 — Installer les dépendances

```bash
npm install
```

Cela installe les 2 dépendances : `express` et `better-sqlite3`.

---

## Étape 4 — Lancer l'application

Deux modes au choix :

### Option A — Mode navigateur (le plus simple)

```bash
npm start
```

Le terminal affiche :

```
BNS Stock Manager démarré ✔
→ http://localhost:3002
```

Ouvrir le navigateur sur **http://localhost:3002**

> La base SQLite `database/stock.db` est créée automatiquement au premier lancement.

Pour arrêter : `Ctrl + C` dans le terminal.

### Option B — Application desktop (fenêtre Electron)

1. **Une seule fois** (ou après chaque `npm install`), compiler le module SQLite pour Electron :

```bash
npm run sqlite:electron
```

2. Lancer l'application :

```bash
npm run desktop
```

Une fenêtre de bureau s'ouvre (serveur + base + interface dans un seul programme).
Fermer la fenêtre arrête tout.

---

## Étape 5 — (Optionnel) Créer le fichier .exe portable

```bash
npm run dist
```

Génère `dist/BNS Stock Manager.exe` — version portable à copier sur n'importe quel
PC Windows, sans installation. Les données (base `stock.db`, images, sauvegardes)
sont créées dans `%APPDATA%\BNS Stock Manager\` (dossier `userData` d'Electron) —
jamais dans le package, qui est en lecture seule.

---

## Dépannage

| Problème | Solution |
|---|---|
| `npm install` échoue sur better-sqlite3 | Mettre à jour Node.js (v18+) et relancer `npm install` |
| Erreur `NODE_MODULE_VERSION` / ABI au démarrage | Module compilé pour le mauvais moteur : `npm run sqlite:node` pour le mode navigateur, `npm run sqlite:electron` pour le mode desktop |
| Port 3002 déjà utilisé | `set PORT=4000 && npm start` puis ouvrir `http://localhost:4000` |
| Page blanche | Vérifier que le serveur tourne et que l'URL est `http://localhost:3002` |
| Base corrompue | Arrêter le serveur, copier une sauvegarde de `database/backups/` vers `database/stock.db`, relancer |

> **Note :** pour alterner entre les deux modes, relancer le script SQLite
> correspondant (`sqlite:node` ou `sqlite:electron`) — le module natif
> `better-sqlite3` est compilé pour un seul moteur à la fois.

---

## Résumé rapide (mémo)

```bash
cd BNS-Stock
npm install
npm start          # → http://localhost:3002
```

ou, en mode desktop :

```bash
npm run sqlite:electron   # une seule fois
npm run desktop
npm run dist /as admin
```
