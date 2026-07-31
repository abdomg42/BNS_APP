/**
 * productController.js — Logique HTTP des produits.
 */
const productModel = require('../models/productModel');
const { saveBase64Image } = require('./uploadHelper');

/** Nettoie et valide le corps de la requête produit. */
function sanitize(body) {
  const data = {
    name: String(body.name || '').trim(),
    category_id: body.category_id ? Number(body.category_id) : null,
    description: String(body.description || '').trim(),
    photo: String(body.photo || ''),
    purchase_price: Math.max(0, Number(body.purchase_price) || 0),
    sale_price: Math.max(0, Number(body.sale_price) || 0),
    quantity: Math.max(0, parseInt(body.quantity, 10) || 0),
    min_stock: Math.max(0, parseInt(body.min_stock, 10) || 0)
  };
  if (!data.name) throw new Error('Le nom du produit est obligatoire');
  // photo_data = image en base64 envoyée depuis le formulaire
  if (body.photo_data) data.photo = saveBase64Image(body.photo_data);
  return data;
}

exports.list = (req, res, next) => {
  try {
    res.json(productModel.all(req.query.search || '', req.query.category_id || null));
  } catch (e) { next(e); }
};

exports.get = (req, res, next) => {
  try {
    const p = productModel.find(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(p);
  } catch (e) { next(e); }
};

exports.create = (req, res, next) => {
  try { res.status(201).json(productModel.create(sanitize(req.body))); }
  catch (e) { next(e); }
};

exports.update = (req, res, next) => {
  try {
    if (!productModel.find(req.params.id)) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    res.json(productModel.update(req.params.id, sanitize(req.body)));
  } catch (e) { next(e); }
};

exports.remove = (req, res, next) => {
  try {
    productModel.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.lowStock = (req, res, next) => {
  try { res.json(productModel.lowStock()); }
  catch (e) { next(e); }
};
