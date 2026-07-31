/**
 * invoiceModel.js — Factures et leurs lignes (invoice_items).
 * À la création (validation), le stock est décrémenté et un
 * mouvement de stock "sortie" est enregistré pour chaque produit.
 */
const db = require('./db');
const productModel = require('./productModel');

/** Génère un numéro de facture unique : FAC-0001, FAC-0002...
 *  Basé sur MAX(id) (et non COUNT) pour rester unique même après suppression. */
function nextNumber() {
  const row = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM invoices').get();
  return 'FAC-' + String(row.n).padStart(4, '0');
}

function computeTotals(items, tvaRate) {
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const tva = subtotal * (tvaRate / 100);
  return { subtotal, tva, total: subtotal + tva };
}

module.exports = {
  all() {
    return db.prepare(`
      SELECT i.*, c.name AS customer_name
      FROM invoices i JOIN customers c ON c.id = i.customer_id
      ORDER BY i.created_at DESC
    `).all();
  },

  find(id) {
    const invoice = db.prepare(`
      SELECT i.*, c.name AS customer_name, c.phone AS customer_phone,
             c.email AS customer_email, c.address AS customer_address
      FROM invoices i JOIN customers c ON c.id = i.customer_id
      WHERE i.id = ?
    `).get(id);
    if (invoice) {
      invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
    }
    return invoice;
  },

  /**
   * Crée et valide une facture.
   * Transaction : si le stock est insuffisant pour un produit,
   * tout est annulé et une erreur est levée.
   */
  create({ customer_id, items, tva_rate }) {
    const { subtotal, tva, total } = computeTotals(items, tva_rate);

    const tx = db.transaction(() => {
      // Vérification du stock AVANT toute écriture
      for (const it of items) {
        if (!it.product_id) continue;
        const p = productModel.find(it.product_id);
        if (!p) throw new Error(`Produit introuvable : ${it.product_name}`);
        if (p.quantity < it.quantity) {
          throw new Error(`Stock insuffisant pour « ${p.name} » (disponible : ${p.quantity})`);
        }
      }

      const info = db.prepare(`
        INSERT INTO invoices (number, customer_id, subtotal, tva_rate, tva_amount, total, status)
        VALUES (?, ?, ?, ?, ?, ?, 'validée')
      `).run(nextNumber(), customer_id, subtotal, tva_rate, tva, total);
      const invoiceId = info.lastInsertRowid;
      const number = 'FAC-' + String(invoiceId).padStart(4, '0');

      const insItem = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_id, product_name, unit_price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insMvt = db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity, reason)
        VALUES (?, 'sortie', ?, ?)
      `);

      for (const it of items) {
        insItem.run(invoiceId, it.product_id, it.product_name, it.unit_price,
                    it.quantity, it.unit_price * it.quantity);
        if (it.product_id) {
          productModel.adjustQuantity(it.product_id, -it.quantity); // mise à jour du stock
          insMvt.run(it.product_id, it.quantity, `Facture ${number}`);
        }
      }
      return invoiceId;
    });

    return this.find(tx());
  },

  remove(id) {
    return db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  }
};
