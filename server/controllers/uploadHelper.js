/**
 * uploadHelper.js — Enregistre une image envoyée en base64
 * dans le dossier images (zone inscriptible, voir server/paths.js)
 * et renvoie son chemin public.
 * (Évite la dépendance multer : léger et suffisant ici.)
 */
const fs = require('fs');
const path = require('path');
const { imagesDir, ensureDir } = require('../paths');

const ALLOWED = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo

/**
 * @param {string} dataUrl  ex: "data:image/png;base64,iVBOR..."
 * @returns {string} chemin public ex: "/uploads/images/1719....png"
 */
function saveBase64Image(dataUrl) {
  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match || !ALLOWED[match[1]]) {
    throw new Error("Format d'image non supporté (PNG, JPG, WEBP, GIF)");
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_SIZE) throw new Error('Image trop lourde (max 2 Mo)');

  ensureDir(imagesDir);
  const filename = Date.now() + '-' + Math.round(Math.random() * 1e6) + ALLOWED[match[1]];
  fs.writeFileSync(path.join(imagesDir, filename), buffer);
  return '/uploads/images/' + filename;
}

module.exports = { saveBase64Image };
