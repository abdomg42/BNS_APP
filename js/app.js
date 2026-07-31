/**
 * app.js — Layout commun à toutes les pages :
 * injection du sidebar (logo + navigation), de la topbar,
 * chargement des paramètres (nom, logo, devise) et des alertes stock.
 */

/* Icônes SVG (inline, aucune bibliothèque) */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  products:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2z"/><path d="M12 11 4 6.5M12 11l8-4.5M12 11v9"/></svg>',
  categories:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.4c2.3.3 4.2 1.9 4.9 4.6"/></svg>',
  quotes:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
  invoices:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
  stock:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M3 9h18M9 13h6"/></svg>',
  settings:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.1a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.1A1.7 1.7 0 0 0 21 10h0a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/></svg>',
  bell:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0"/></svg>',
  burger:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
};

const NAV_ITEMS = [
  { page: 'dashboard',  href: 'dashboard.html',  label: 'Tableau de bord', icon: 'dashboard' },
  { page: 'products',   href: 'products.html',   label: 'Produits',        icon: 'products' },
  { page: 'categories', href: 'categories.html', label: 'Catégories',      icon: 'categories' },
  { page: 'customers',  href: 'customers.html',  label: 'Clients',         icon: 'customers' },
  { page: 'quotes',     href: 'quotes.html',     label: 'Devis',           icon: 'quotes' },
  { page: 'invoices',   href: 'invoices.html',   label: 'Factures',        icon: 'invoices' },
  { page: 'stock',      href: 'stock.html',      label: 'Stock',           icon: 'stock' },
  { page: 'settings',   href: 'settings.html',   label: 'Paramètres',      icon: 'settings' }
];

/** Construit le sidebar avec le logo de l'entreprise */
function renderSidebar(settings) {
  const current = document.body.dataset.page;
  const logo = settings.company_logo || '/uploads/images/logo.png';
  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-logo">
      <img src="${escapeHtml(logo)}" alt="Logo ${escapeHtml(settings.company_name || 'BNS')}">
      <div class="app-name">${escapeHtml(settings.company_name || 'BNS')} Stock Manager</div>
    </div>
    <nav>
      ${NAV_ITEMS.map(item => `
        <a class="nav-link ${item.page === current ? 'active' : ''}" href="${item.href}">
          ${ICONS[item.icon]}<span>${item.label}</span>
        </a>`).join('')}
    </nav>
    <div class="sidebar-footer">BNS Stock Manager v1.0</div>`;
}

/** Construit la topbar : burger (mobile), titre, alerte stock */
function renderTopbar(lowStockCount) {
  const title = document.body.dataset.title || '';
  const danger = lowStockCount > 0;
  document.getElementById('topbar').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <button class="burger" id="burger" aria-label="Menu">${ICONS.burger}</button>
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="topbar-right">
      <a href="stock.html" class="alert-bell ${danger ? 'danger' : ''}" title="Produits en faible stock">
        ${ICONS.bell}
        <span>Alertes stock</span>
        ${danger ? `<span class="alert-count">${lowStockCount}</span>` : ''}
      </a>
    </div>`;

  const burger = document.getElementById('burger');
  if (burger) burger.onclick = () => document.getElementById('sidebar').classList.toggle('open');
}

/* ---------- Initialisation commune ---------- */
(async function initApp() {
  try {
    // Paramètres (nom, logo, devise…) partagés via window.APP_SETTINGS
    window.APP_SETTINGS = await API.get('/settings');
  } catch (e) {
    window.APP_SETTINGS = {};
    showToast('Impossible de charger les paramètres : ' + e.message, 'error');
  }
  renderSidebar(window.APP_SETTINGS);

  try {
    const low = await API.get('/stock/alerts');
    renderTopbar(low.length);
  } catch (e) {
    renderTopbar(0);
  }
})();
