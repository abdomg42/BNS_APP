# BNS Stock Manager

Application desktop de gestion de stock pour petits commerces.
Légère et rapide : fonctionne sur un PC Windows avec 4 Go de RAM.

**Technologies :** HTML5, CSS3, JavaScript (Vanilla) · Node.js, Express.js, SQLite (better-sqlite3).
Aucun framework frontend (pas de React, Vue, Angular, Tailwind).

---

## 1. Prérequis

- **Node.js** version 18 ou supérieure → https://nodejs.org
- Windows 10/11 (fonctionne aussi sur Linux/macOS)

Vérifier l'installation :

```bash
node -v
npm -v
```

## 2. Installation

Ouvrir un terminal dans le dossier `BNS-Stock` puis :

```bash
npm install
```

Cela installe les 2 seules dépendances : `express` et `better-sqlite3`.

## 3. Démarrage

### Option A — Application desktop (Electron)

```bash
npm run desktop
```

Une fenêtre de bureau s'ouvre : serveur, base SQLite et interface dans un
seul programme. Fermer la fenêtre arrête tout.

### Option B — Mode navigateur (léger)

```bash
npm start
```

Puis ouvrir le navigateur sur :

```
http://localhost:3000
```

Pour arrêter le serveur : `Ctrl + C` dans le terminal.

### Créer le fichier .exe (distribution)

```bash
npm run dist
```

Génère `dist/BNS Stock Manager.exe` (version portable, aucune installation
requise) — à copier sur n'importe quel PC Windows. La base `stock.db` est
créée à côté de l'exécutable au premier lancement.

---

## 4. Comment ça fonctionne

### Architecture

```
Navigateur (HTML/CSS/JS Vanilla)
        │  fetch() → JSON
        ▼
Serveur Express (server/server.js)  →  API REST sous /api
        │
        ▼
SQLite (database/stock.db)  →  un seul fichier, aucune installation
```

Le serveur Express fait deux choses :
1. **Sert les fichiers statiques** (pages HTML, CSS, JS, images).
2. **Expose l'API REST** (`/api/products`, `/api/customers`, etc.) qui lit/écrit dans SQLite.

La base de données est **créée automatiquement** au premier démarrage
(`server/models/db.js`), avec les tables : `products`, `categories`,
`customers`, `quotes`, `quote_items`, `invoices`, `invoice_items`,
`stock_movements`, `settings` — toutes reliées par clés étrangères.

### Structure du projet

```
BNS-Stock/
├── index.html            → redirige vers le tableau de bord
├── dashboard.html        → statistiques (cartes)
├── products.html         → gestion des produits
├── categories.html       → gestion des catégories
├── customers.html        → gestion des clients
├── quotes.html           → devis
├── invoices.html         → factures
├── stock.html            → mouvements de stock + alertes
├── settings.html         → paramètres entreprise (TVA, devise, logo)
├── print.html            → document imprimable / export PDF
├── css/                  → style.css, dashboard.css, table.css, modal.css
├── js/                   → app.js (layout commun), utils.js, + 1 fichier par page
├── database/
│   ├── stock.db          → base SQLite (créée au 1er démarrage)
│   └── backups/          → sauvegardes automatiques
├── server/
│   ├── server.js         → démarrage Express + backup auto
│   ├── routes/           → routes API (/api/...)
│   ├── controllers/      → validation des données + réponses HTTP
│   └── models/           → requêtes SQL (better-sqlite3)
├── desktop/
│   └── main.js           → processus Electron (fenêtre de bureau)
├── uploads/images/       → photos produits + logo entreprise
└── package.json
```

### Flux principaux

- **Produits** : CRUD complet, photo avec aperçu, recherche instantanée,
  tri des colonnes, filtre par catégorie, pagination.
- **Devis** : choix du client → ajout de lignes produits → calcul
  automatique sous-total / TVA / total TTC → export PDF ou impression.
- **Factures** : identique aux devis, et **à la validation le stock est
  décrémenté automatiquement** (transaction SQL : si le stock est
  insuffisant, la facture est refusée et rien n'est écrit).
- **Stock** : entrées/sorties manuelles avec motif, historique complet,
  alerte visuelle quand `quantité ≤ stock minimum`.
- **PDF / Impression** : la page `print.html` génère un document structuré
  avec le logo BNS, les infos entreprise et le client. *Exporter en PDF* =
  « Imprimer → Enregistrer au format PDF » du navigateur.
- **Paramètres** : nom, logo, adresse, téléphone, email de l'entreprise,
  taux de TVA et devise — utilisés sur les documents et les calculs.

### Sauvegarde automatique

La base `stock.db` est copiée dans `database/backups/` :
- à chaque démarrage du serveur ;
- puis toutes les 6 heures.

Seules les **10 dernières sauvegardes** sont conservées.
Pour restaurer : arrêter le serveur, copier un fichier
`database/backups/stock-AAAA-MM-JJ-HH-MM.db` vers `database/stock.db`,
relancer.

### API REST (résumé)

| Méthode | Route | Rôle |
|---|---|---|
| GET/POST | `/api/products` | liste / création produit |
| PUT/DELETE | `/api/products/:id` | modification / suppression |
| GET/POST | `/api/categories` | catégories (idem PUT/DELETE `/:id`) |
| GET/POST | `/api/customers` | clients (idem PUT/DELETE `/:id`) |
| GET/POST | `/api/quotes` | devis (+ PATCH `/:id/status`) |
| GET/POST | `/api/invoices` | factures (validation = déstockage) |
| GET/POST | `/api/stock/movements` | historique / nouveau mouvement |
| GET | `/api/stock/alerts` | produits en stock faible |
| GET/PUT | `/api/settings` | paramètres entreprise |
| GET | `/api/stats/dashboard` | statistiques du tableau de bord |

Les images sont envoyées en **base64** dans le JSON (champ `photo_data`),
le serveur les enregistre dans `uploads/images/` (max 2 Mo : PNG, JPG, WEBP, GIF).

---

## 5. Dépannage

| Problème | Solution |
|---|---|
| `npm install` échoue sur better-sqlite3 | Mettre à jour Node.js (v18+) et relancer |
| Port 3000 déjà utilisé | `set PORT=4000 && npm start` |
| Page blanche | Vérifier que le serveur tourne et ouvrir `http://localhost:3000` |
| Base corrompue | Restaurer une sauvegarde (voir §4) |
