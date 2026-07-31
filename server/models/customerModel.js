/**
 * customerModel.js — Accès aux données des clients.
 */
const db = require('./db');

module.exports = {
  all(search = '') {
    if (search) {
      return db.prepare(`
        SELECT * FROM customers
        WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
        ORDER BY created_at DESC
      `).all(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    return db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  },

  find(id) {
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  },

  create(data) {
    const info = db.prepare(`
      INSERT INTO customers (name, phone, email, address)
      VALUES (@name, @phone, @email, @address)
    `).run(data);
    return this.find(info.lastInsertRowid);
  },

  update(id, data) {
    db.prepare(`
      UPDATE customers SET name = @name, phone = @phone, email = @email, address = @address
      WHERE id = @id
    `).run({ ...data, id });
    return this.find(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  }
};
