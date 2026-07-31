/**
 * server.js — Serveur Express de BNS Stock Manager.
 * - Sert les pages HTML/CSS/JS (fichiers statiques)
 * - Expose l'API REST sous /api
 * - Sauvegarde automatique de la base SQLite
 *
 * Démarrage :  npm start   puis ouvrir  http://localhost:3000
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
require('./models/db'); // initialise la base au démarrage

const app = express();
const PORT = process.env.PORT || 3002;
const ROOT = path.join(__dirname, '..');

app.use(express.json({ limit: '5mb' })); // images base64 incluses

/* Fichiers statiques : pages, css, js, images */
app.use(express.static(ROOT));

/* API REST */
app.use('/api', require('./routes'));

/* Page d'accueil */
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

/* 404 API */
app.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable' }));

/* Gestion centralisée des erreurs → message clair pour l'utilisateur */
app.use((err, req, res, next) => {
  console.error('[Erreur]', err.message);
  res.status(400).json({ error: err.message || 'Erreur serveur' });
});

/* ---------- Sauvegarde automatique de la base ---------- */
const DB_PATH = path.join(ROOT, 'database', 'stock.db');
const BACKUP_DIR = path.join(ROOT, 'database', 'backups');

function backupDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, `stock-${stamp}.db`));
    // Garder seulement les 10 dernières sauvegardes
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db')).sort();
    while (files.length > 10) fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
    console.log('[Backup] Base sauvegardée :', stamp);
  } catch (e) {
    console.error('[Backup] Échec :', e.message);
  }
}

app.listen(PORT, () => {
  backupDatabase();                              // au démarrage
  setInterval(backupDatabase, 6 * 60 * 60 * 1000); // puis toutes les 6 h
  console.log(`\n  BNS Stock Manager démarré ✔`);
  console.log(`  → http://localhost:${PORT}\n`);
});
