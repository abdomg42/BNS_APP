/**
 * statsModel.js — Statistiques du tableau de bord.
 */
const db = require('./db');

module.exports = {
  dashboard() {
    const g = sql => db.prepare(sql).get();
    return {
      products: g('SELECT COUNT(*) AS n FROM products').n,
      lowStock: g('SELECT COUNT(*) AS n FROM products WHERE quantity <= min_stock').n,
      customers: g('SELECT COUNT(*) AS n FROM customers').n,
      quotes: g('SELECT COUNT(*) AS n FROM quotes').n,
      invoices: g('SELECT COUNT(*) AS n FROM invoices').n,
      stockValue: g('SELECT COALESCE(SUM(purchase_price * quantity), 0) AS v FROM products').v,
      revenue: g('SELECT COALESCE(SUM(total), 0) AS v FROM invoices').v
    };
  }
};
