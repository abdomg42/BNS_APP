/**
 * categoryModel.js — Accès aux données des catégories.
 */
const db = require('./db');

module.exports = {
  all() {
    return db.prepare(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
  },

  find(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  create(data) {
    const info = db.prepare(
      'INSERT INTO categories (name, description) VALUES (@name, @description)'
    ).run(data);
    return this.find(info.lastInsertRowid);
  },

  update(id, data) {
    db.prepare(
      'UPDATE categories SET name = @name, description = @description WHERE id = @id'
    ).run({ ...data, id });
    return this.find(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
};
