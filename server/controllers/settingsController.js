/**
 * settingsController.js — Paramètres + statistiques du tableau de bord.
 */
const settingsModel = require('../models/settingsModel');
const statsModel = require('../models/statsModel');
const { saveBase64Image } = require('./uploadHelper');

exports.getSettings = (req, res, next) => {
  try { res.json(settingsModel.all()); } catch (e) { next(e); }
};

exports.updateSettings = (req, res, next) => {
  try {
    const data = { ...req.body };
    // Logo envoyé en base64 → sauvegarde fichier
    if (data.company_logo_data) {
      data.company_logo = saveBase64Image(data.company_logo_data);
      delete data.company_logo_data;
    }
    if (data.tva_rate !== undefined) {
      const tva = Number(data.tva_rate);
      if (isNaN(tva) || tva < 0 || tva > 100) throw new Error('Taux de TVA invalide (0-100)');
    }
    res.json(settingsModel.update(data));
  } catch (e) { next(e); }
};

exports.dashboard = (req, res, next) => {
  try { res.json(statsModel.dashboard()); } catch (e) { next(e); }
};
