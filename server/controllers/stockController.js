/**
 * stockController.js — Mouvements de stock + alertes.
 */
const stockModel = require('../models/stockModel');
const productModel = require('../models/productModel');

exports.history = (req, res, next) => {
  try { res.json(stockModel.history(req.query.product_id || null)); }
  catch (e) { next(e); }
};

exports.move = (req, res, next) => {
  try {
    const { product_id, type } = req.body;
    const quantity = parseInt(req.body.quantity, 10) || 0;
    const reason = String(req.body.reason || '').trim();

    if (!productModel.find(product_id)) throw new Error('Produit introuvable');
    if (!['entree', 'sortie'].includes(type)) throw new Error('Type de mouvement invalide');
    if (quantity <= 0) throw new Error('La quantité doit être supérieure à 0');

    const product = stockModel.addMovement({ product_id, type, quantity, reason });
    res.json({ success: true, product, lowStock: product.quantity <= product.min_stock });
  } catch (e) { next(e); }
};

/** Produits dont le stock est au niveau minimum ou en dessous */
exports.alerts = (req, res, next) => {
  try { res.json(productModel.lowStock()); }
  catch (e) { next(e); }
};
