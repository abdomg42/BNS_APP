/**
 * productModel.js — Accès aux données des produits.
 */
const db = require('./db');

const baseSelect = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

module.exports = {
  all(search = '', categoryId = null) {
    let sql = baseSelect + ' WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    sql += ' ORDER BY p.created_at DESC';
    return db.prepare(sql).all(...params);
  },

  find(id) {
    return db.prepare(baseSelect + ' WHERE p.id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO products (name, category_id, description, photo, purchase_price, sale_price, quantity, min_stock)
      VALUES (@name, @category_id, @description, @photo, @purchase_price, @sale_price, @quantity, @min_stock)
    `);
    const info = stmt.run(data);
    return this.find(info.lastInsertRowid);
  },

  update(id, data) {
    db.prepare(`
      UPDATE products SET
        name = @name, category_id = @category_id, description = @description,
        photo = @photo, purchase_price = @purchase_price, sale_price = @sale_price,
        quantity = @quantity, min_stock = @min_stock
      WHERE id = @id
    `).run({ ...data, id });
    return this.find(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM products WHERE id = ?').run(id);
  },

  /** Ajuste la quantité (delta positif ou négatif) */
  adjustQuantity(id, delta) {
    db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(delta, id);
  },

  lowStock() {
    return db.prepare(baseSelect + ' WHERE p.quantity <= p.min_stock ORDER BY p.quantity ASC').all();
  }
};
