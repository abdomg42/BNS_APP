/**
 * invoiceController.js — Logique HTTP des factures.
 */
const invoiceModel = require('../models/invoiceModel');
const productModel = require('../models/productModel');

/** Même validation que les devis, côté facture. */
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
  try { res.json(invoiceModel.all()); } catch (e) { next(e); }
};

exports.get = (req, res, next) => {
  try {
    const inv = invoiceModel.find(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Facture introuvable' });
    res.json(inv);
  } catch (e) { next(e); }
};

exports.create = (req, res, next) => {
  try { res.status(201).json(invoiceModel.create(sanitize(req.body))); }
  catch (e) { next(e); }
};

exports.remove = (req, res, next) => {
  try {
    invoiceModel.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};
