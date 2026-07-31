/**
 * stockModel.js — Mouvements de stock (entrées / sorties manuelles).
 */
const db = require('./db');
const productModel = require('./productModel');

module.exports = {
  /** Historique complet, du plus récent au plus ancien */
  history(productId = null) {
    let sql = `
      SELECT m.*, p.name AS product_name
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
    `;
    const params = [];
    if (productId) {
      sql += ' WHERE m.product_id = ?';
      params.push(productId);
    }
    sql += ' ORDER BY m.created_at DESC, m.id DESC LIMIT 500';
    return db.prepare(sql).all(...params);
  },

  /**
   * Ajoute ('entree') ou retire ('sortie') du stock.
   * Transaction : mise à jour produit + enregistrement du mouvement.
   */
  addMovement({ product_id, type, quantity, reason = '' }) {
    const tx = db.transaction(() => {
      const product = productModel.find(product_id);
      if (!product) throw new Error('Produit introuvable');
      if (type === 'sortie' && product.quantity < quantity) {
        throw new Error(`Stock insuffisant (disponible : ${product.quantity})`);
      }
      productModel.adjustQuantity(product_id, type === 'entree' ? quantity : -quantity);
      db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity, reason)
        VALUES (?, ?, ?, ?)
      `).run(product_id, type, quantity, reason);
    });
    tx();
    return productModel.find(product_id);
  }
};
