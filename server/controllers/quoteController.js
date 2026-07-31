/**
 * quoteController.js — Logique HTTP des devis.
 */
const quoteModel = require('../models/quoteModel');
const productModel = require('../models/productModel');

/** Valide client + lignes, et complète chaque ligne depuis le produit. */
function sanitize(body) {
  const customer_id = Number(body.customer_id);
  if (!customer_id) throw new Error('Veuillez choisir un client');

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) throw new Error('Ajoutez au moins un produit');

  const clean = items.map(it => {
    const product = productModel.find(it.product_id);
    if (!product) throw new Error('Produit invalide dans une ligne');
    const quantity = parseInt(it.quantity, 10) || 0;
    if (quantity <= 0) throw new Error(`Quantité invalide pour « ${product.name} »`);
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price: product.sale_price,
      quantity
    };
  });

  return { customer_id, items: clean, tva_rate: Number(body.tva_rate) || 0 };
}

exports.list = (req, res, next) => {
  try { res.json(quoteModel.all()); } catch (e) { next(e); }
};

exports.get = (req, res, next) => {
  try {
    const q = quoteModel.find(req.params.id);
    if (!q) return res.status(404).json({ error: 'Devis introuvable' });
    res.json(q);
  } catch (e) { next(e); }
};

exports.create = (req, res, next) => {
  try { res.status(201).json(quoteModel.create(sanitize(req.body))); }
  catch (e) { next(e); }
};

exports.updateStatus = (req, res, next) => {
  try {
    const allowed = ['en attente', 'accepté', 'refusé'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    res.json(quoteModel.updateStatus(req.params.id, req.body.status));
  } catch (e) { next(e); }
};

exports.remove = (req, res, next) => {
  try {
    quoteModel.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};
