/**
 * paths.js — Chemins centralisés de l'application.
 *
 * Règle d'or : on n'écrit JAMAIS dans le package de l'application
 * (app.asar est en lecture seule → erreur ENOTDIR). Tous les fichiers
 * inscriptibles (base SQLite, images uploadées, sauvegardes, PDF,
 * temporaires, logs) vivent dans :
 *
 *   - production (.exe packagé) : app.getPath('userData')
 *     ex. C:\Users\<utilisateur>\AppData\Roaming\BNS Stock Manager
 *   - développement (npm start / electron .) : la racine du projet
 *
 * Les assets (HTML, CSS, JS, logo par défaut) restent lus depuis
 * rootDir, qui peut se trouver à l'intérieur d'app.asar (lecture OK).
 *
 * Tout module ayant besoin d'un chemin l'importe d'ici :
 *   const { databaseFile, imagesDir } = require('../paths');
 */
const path = require('path');
const fs = require('fs');

/* ---------- Détection de l'environnement ---------- */
let electronApp = null;
try {
  // Sous Node pur, require('electron') renvoie un simple chemin (string)
  // sans propriété .app — le garde process.versions.electron l'évite.
  if (process.versions.electron) {
    electronApp = require('electron').app || null;
  }
} catch {
  electronApp = null; // pas sous Electron
}

const isPackaged = !!(electronApp && electronApp.isPackaged);
const isDev = !isPackaged;

/* ---------- Racines ---------- */
// Assets en lecture seule (peut être à l'intérieur d'app.asar)
const rootDir = path.join(__dirname, '..');

// Base inscriptible : userData en production, racine du projet en dev
const dataDir = isPackaged ? electronApp.getPath('userData') : rootDir;

/* ---------- Dossiers inscriptibles ---------- */
const databaseDir = path.join(dataDir, 'database');
const databaseFile = path.join(databaseDir, 'stock.db');
const backupsDir = path.join(databaseDir, 'backups');
const uploadsDir = path.join(dataDir, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const pdfDir = path.join(dataDir, 'pdfs');
const tempDir = path.join(dataDir, 'temp');
const logsDir = path.join(dataDir, 'logs');

/** Crée un dossier (et ses parents) s'il n'existe pas. Retourne le chemin. */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Création automatique de tous les dossiers inscriptibles au chargement
[databaseDir, backupsDir, imagesDir, pdfDir, tempDir, logsDir].forEach(ensureDir);

module.exports = {
  isPackaged,
  isDev,
  rootDir,
  dataDir,
  databaseDir,
  databaseFile,
  backupsDir,
  uploadsDir,
  imagesDir,
  pdfDir,
  tempDir,
  logsDir,
  ensureDir
};
