/**
 * categoryController.js — Logique HTTP des catégories.
 */
const categoryModel = require('../models/categoryModel');

function sanitize(body) {
  const data = {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim()
  };
  if (!data.name) throw new Error('Le nom de la catégorie est obligatoire');
  return data;
}

exports.list = (req, res, next) => {
  try { res.json(categoryModel.all()); } catch (e) { next(e); }
};

exports.create = (req, res, next) => {
  try { res.status(201).json(categoryModel.create(sanitize(req.body))); }
  catch (e) {
    if (String(e.message).includes('UNIQUE')) e.message = 'Cette catégorie existe déjà';
    next(e);
  }
};

exports.update = (req, res, next) => {
  try {
    if (!categoryModel.find(req.params.id)) {
      return res.status(404).json({ error: 'Catégorie introuvable' });
    }
    res.json(categoryModel.update(req.params.id, sanitize(req.body)));
  } catch (e) { next(e); }
};

exports.remove = (req, res, next) => {
  try {
    categoryModel.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};
