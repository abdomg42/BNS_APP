/**
 * customerController.js — Logique HTTP des clients.
 */
const customerModel = require('../models/customerModel');

function sanitize(body) {
  const data = {
    name: String(body.name || '').trim(),
    phone: String(body.phone || '').trim(),
    email: String(body.email || '').trim(),
    address: String(body.address || '').trim()
  };
  if (!data.name) throw new Error('Le nom du client est obligatoire');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Adresse email invalide');
  }
  return data;
}

exports.list = (req, res, next) => {
  try { res.json(customerModel.all(req.query.search || '')); }
  catch (e) { next(e); }
};

exports.get = (req, res, next) => {
  try {
    const c = customerModel.find(req.params.id);
    if (!c) return res.status(404).json({ error: 'Client introuvable' });
    res.json(c);
  } catch (e) { next(e); }
};

exports.create = (req, res, next) => {
  try { res.status(201).json(customerModel.create(sanitize(req.body))); }
  catch (e) { next(e); }
};

exports.update = (req, res, next) => {
  try {
    if (!customerModel.find(req.params.id)) {
      return res.status(404).json({ error: 'Client introuvable' });
    }
    res.json(customerModel.update(req.params.id, sanitize(req.body)));
  } catch (e) { next(e); }
};

exports.remove = (req, res, next) => {
  try {
    customerModel.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};
