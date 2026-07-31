/**
 * dashboard.js — Cartes statistiques + liste des produits en faible stock.
 */
(async function initDashboard() {
  const grid = document.getElementById('stats-grid');
  const list = document.getElementById('low-stock-list');

  try {
    const stats = await API.get('/stats/dashboard');

    const cards = [
      { label: 'Produits',            value: stats.products,            icon: ICONS.products,  color: 'blue' },
      { label: 'Stock faible',        value: stats.lowStock,            icon: ICONS.bell,      color: stats.lowStock > 0 ? 'red' : 'green' },
      { label: 'Clients',             value: stats.customers,           icon: ICONS.customers, color: 'purple' },
      { label: 'Devis',               value: stats.quotes,              icon: ICONS.quotes,    color: 'teal' },
      { label: 'Factures',            value: stats.invoices,            icon: ICONS.invoices,  color: 'orange' },
      { label: 'Valeur du stock',     value: formatMoney(stats.stockValue), icon: ICONS.stock, color: 'green' },
      { label: 'Chiffre d\'affaires', value: formatMoney(stats.revenue),    icon: ICONS.dashboard, color: 'blue' }
    ];

    grid.innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-icon ${c.color}">${c.icon}</div>
        <div class="stat-info">
          <div class="stat-value">${c.value}</div>
          <div class="stat-label">${c.label}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    grid.innerHTML = `<div class="card">Erreur de chargement : ${escapeHtml(e.message)}</div>`;
  }

  try {
    const low = await API.get('/products/low-stock');
    if (low.length === 0) {
      list.innerHTML = '<p class="muted" style="padding:8px 0">Aucune alerte — tous les stocks sont au-dessus du minimum. ✔</p>';
      return;
    }
    list.innerHTML = low.map(p => `
      <div class="low-stock-item ${p.quantity === 0 ? 'critical' : ''}">
        <div style="display:flex;align-items:center;gap:12px">
          ${productThumb(p)}
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div class="muted">${escapeHtml(p.category_name || 'Sans catégorie')} · min : ${p.min_stock}</div>
          </div>
        </div>
        <span class="badge ${p.quantity === 0 ? 'badge-red' : 'badge-orange'}">
          ${p.quantity === 0 ? 'Rupture' : 'Reste ' + p.quantity}
        </span>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<p class="muted">Erreur : ${escapeHtml(e.message)}</p>`;
  }
})();
