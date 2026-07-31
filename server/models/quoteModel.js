/**
 * quoteModel.js — Devis et leurs lignes (quote_items).
 */
const db = require('./db');

/** Génère un numéro de devis unique : DEV-0001, DEV-0002...
 *  Basé sur MAX(id) (et non COUNT) pour rester unique même après suppression. */
function nextNumber() {
  const row = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM quotes').get();
  return 'DEV-' + String(row.n).padStart(4, '0');
}

/** Calcule sous-total, TVA et total TTC à partir des lignes. */
function computeTotals(items, tvaRate) {
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const tva = subtotal * (tvaRate / 100);
  return { subtotal, tva, total: subtotal + tva };
}

module.exports = {
  all() {
    return db.prepare(`
      SELECT q.*, c.name AS customer_name
      FROM quotes q JOIN customers c ON c.id = q.customer_id
      ORDER BY q.created_at DESC
    `).all();
  },

  find(id) {
    const quote = db.prepare(`
      SELECT q.*, c.name AS customer_name, c.phone AS customer_phone,
             c.email AS customer_email, c.address AS customer_address
      FROM quotes q JOIN customers c ON c.id = q.customer_id
      WHERE q.id = ?
    `).get(id);
    if (quote) {
      quote.items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(id);
    }
    return quote;
  },

  create({ customer_id, items, tva_rate, status = 'en attente' }) {
    const { subtotal, tva, total } = computeTotals(items, tva_rate);
    const tx = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO quotes (number, customer_id, subtotal, tva_rate, tva_amount, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(nextNumber(), customer_id, subtotal, tva_rate, tva, total, status);
      const quoteId = info.lastInsertRowid;
      const ins = db.prepare(`
        INSERT INTO quote_items (quote_id, product_id, product_name, unit_price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const it of items) {
        ins.run(quoteId, it.product_id, it.product_name, it.unit_price, it.quantity,
                it.unit_price * it.quantity);
      }
      return quoteId;
    });
    return this.find(tx());
  },

  updateStatus(id, status) {
    db.prepare('UPDATE quotes SET status = ? WHERE id = ?').run(status, id);
    return this.find(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
  }
};
