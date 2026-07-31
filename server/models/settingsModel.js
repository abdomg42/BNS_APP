/**
 * settingsModel.js — Paramètres de l'entreprise (clé / valeur).
 */
const db = require('./db');

module.exports = {
  all() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },

  update(data) {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    const tx = db.transaction(() => {
      for (const [k, v] of Object.entries(data)) stmt.run(k, String(v ?? ''));
    });
    tx();
    return this.all();
  }
};
