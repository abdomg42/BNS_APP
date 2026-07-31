/**
 * routes/index.js — Point d'entrée de toutes les routes API.
 */
const express = require('express');
const router = express.Router();

const productCtrl = require('../controllers/productController');
const categoryCtrl = require('../controllers/categoryController');
const customerCtrl = require('../controllers/customerController');
const quoteCtrl = require('../controllers/quoteController');
const invoiceCtrl = require('../controllers/invoiceController');
const stockCtrl = require('../controllers/stockController');
const settingsCtrl = require('../controllers/settingsController');

/* Produits */
router.get('/products', productCtrl.list);
router.get('/products/low-stock', productCtrl.lowStock);
router.get('/products/:id', productCtrl.get);
router.post('/products', productCtrl.create);
router.put('/products/:id', productCtrl.update);
router.delete('/products/:id', productCtrl.remove);

/* Catégories */
router.get('/categories', categoryCtrl.list);
router.post('/categories', categoryCtrl.create);
router.put('/categories/:id', categoryCtrl.update);
router.delete('/categories/:id', categoryCtrl.remove);

/* Clients */
router.get('/customers', customerCtrl.list);
router.get('/customers/:id', customerCtrl.get);
router.post('/customers', customerCtrl.create);
router.put('/customers/:id', customerCtrl.update);
router.delete('/customers/:id', customerCtrl.remove);

/* Devis */
router.get('/quotes', quoteCtrl.list);
router.get('/quotes/:id', quoteCtrl.get);
router.post('/quotes', quoteCtrl.create);
router.patch('/quotes/:id/status', quoteCtrl.updateStatus);
router.delete('/quotes/:id', quoteCtrl.remove);

/* Factures */
router.get('/invoices', invoiceCtrl.list);
router.get('/invoices/:id', invoiceCtrl.get);
router.post('/invoices', invoiceCtrl.create);
router.delete('/invoices/:id', invoiceCtrl.remove);

/* Stock */
router.get('/stock/movements', stockCtrl.history);
router.post('/stock/movements', stockCtrl.move);
router.get('/stock/alerts', stockCtrl.alerts);

/* Paramètres + statistiques */
router.get('/settings', settingsCtrl.getSettings);
router.put('/settings', settingsCtrl.updateSettings);
router.get('/stats/dashboard', settingsCtrl.dashboard);

module.exports = router;
