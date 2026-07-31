/**
 * utils.js — Fonctions réutilisables partagées par toutes les pages :
 * appels API, toasts, modales, confirmation, tri, pagination, formats.
 */

/* ---------- Appels API ---------- */
const API = {
  async request(method, url, body) {
    const options = { method, headers: {} };
    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const res = await fetch('/api' + url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erreur serveur (' + res.status + ')');
    return data;
  },
  get:    (url)        => API.request('GET', url),
  post:   (url, body)  => API.request('POST', url, body),
  put:    (url, body)  => API.request('PUT', url, body),
  patch:  (url, body)  => API.request('PATCH', url, body),
  del:    (url)        => API.request('DELETE', url)
};

/* ---------- Formats ---------- */
/** Formate un montant avec la devise configurée : 1 234,56 MAD */
function formatMoney(amount) {
  const currency = (window.APP_SETTINGS && window.APP_SETTINGS.currency) || 'MAD';
  const n = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(Number(amount) || 0);
  return n + ' ' + currency;
}

/** Formate une date SQLite "YYYY-MM-DD HH:MM:SS" → "JJ/MM/AAAA HH:MM" */
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(String(str).replace(' ', 'T'));
  if (isNaN(d)) return str;
  return d.toLocaleDateString('fr-FR') + ' ' +
         d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Échappe le HTML pour éviter les injections XSS */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- Toasts (messages de succès / erreur) ---------- */
function showToast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return alert(message);
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ---------- Modales ---------- */
/**
 * Ouvre une modale.
 * @param {string} title    Titre
 * @param {string} bodyHtml Contenu HTML
 * @param {object} opts     { onSubmit(form, modal), submitLabel, large, hideFooter }
 * @returns l'élément overlay (modal.close() pour fermer)
 */
function openModal(title, bodyHtml, opts = {}) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${opts.large ? 'modal-lg' : ''}">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="modal-close" type="button" aria-label="Fermer">&times;</button>
      </div>
      <form class="modal-form" novalidate>
        <div class="modal-body">${bodyHtml}</div>
        ${opts.hideFooter ? '' : `
        <div class="modal-footer">
          <button type="button" class="btn btn-light btn-cancel">Annuler</button>
          <button type="submit" class="btn btn-primary">${escapeHtml(opts.submitLabel || 'Enregistrer')}</button>
        </div>`}
      </form>
    </div>`;
  root.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.close = close;
  overlay.querySelector('.modal-close').onclick = close;
  const cancelBtn = overlay.querySelector('.btn-cancel');
  if (cancelBtn) cancelBtn.onclick = close;
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

  const form = overlay.querySelector('.modal-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (opts.onSubmit) {
      try { await opts.onSubmit(form, overlay); }
      catch (err) { showToast(err.message, 'error'); }
    }
  });

  // Focus sur le premier champ
  const first = overlay.querySelector('input, select, textarea');
  if (first) setTimeout(() => first.focus(), 50);
  return overlay;
}

/** Boîte de confirmation (suppression) → Promise<boolean> */
function confirmDialog(message) {
  return new Promise(resolve => {
    const modal = openModal('Confirmation', `
      <div class="confirm-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
        </svg>
      </div>
      <p class="confirm-text">${escapeHtml(message)}</p>
    `, {
      submitLabel: 'Confirmer',
      onSubmit: () => { modal.close(); resolve(true); }
    });
    // Remplacer "Annuler" → résout false ; fermeture idem
    modal.querySelector('.btn-cancel').onclick = () => { modal.close(); resolve(false); };
    modal.querySelector('.modal-close').onclick = () => { modal.close(); resolve(false); };
    modal.querySelector('.btn-primary[type="submit"], .modal-footer .btn-primary')
      .classList.replace('btn-primary', 'btn-danger');
  });
}

/* ---------- Image → base64 ---------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) return reject(new Error('Image trop lourde (max 2 Mo)'));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}

/* ---------- Debounce (recherche instantanée) ---------- */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---------- Tri côté client ---------- */
function sortRows(rows, key, dir) {
  return [...rows].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (va == null) va = ''; if (vb == null) vb = '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
}

/* ---------- Pagination côté client ---------- */
const PAGE_SIZE = 8;

/**
 * Rend les boutons de pagination.
 * @param {HTMLElement} container  div.pagination
 * @param {number} total   nombre total d'éléments
 * @param {number} page    page courante (1-based)
 * @param {function} onGo  callback(page)
 */
function renderPagination(container, total, page, onGo) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  let buttons = `<button class="page-btn" data-p="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let p = 1; p <= pages; p++) {
    if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - page) > 1) {
      if (!buttons.endsWith('…')) buttons += '…';
      continue;
    }
    buttons += `<button class="page-btn ${p === page ? 'active' : ''}" data-p="${p}">${p}</button>`;
  }
  buttons += `<button class="page-btn" data-p="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button>`;

  container.innerHTML = `
    <span class="pagination-info">${from}–${to} sur ${total}</span>
    <div class="pagination-buttons">${buttons.replaceAll('…', '<button class="page-btn" disabled>…</button>')}</div>`;

  container.querySelectorAll('.page-btn[data-p]').forEach(btn => {
    btn.onclick = () => onGo(Number(btn.dataset.p));
  });
}

/** Découpe un tableau pour la page demandée */
function pageSlice(rows, page) {
  return rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

/* ---------- En-têtes de tableau triables ---------- */
/**
 * Génère le <thead> avec flèches de tri.
 * @param {Array} columns [{key, label, sortable, align}]
 * @param {object} state  {sortKey, sortDir}
 */
function renderTableHead(columns, state) {
  return '<tr>' + columns.map(col => {
    const arrow = state.sortKey === col.key
      ? `<span class="sort-arrow">${state.sortDir === 1 ? '▲' : '▼'}</span>` : '';
    const align = col.align === 'right' ? ' style="text-align:right"' : '';
    const sortable = col.sortable !== false && col.key;
    return `<th class="${sortable ? 'sortable' : ''}" data-key="${col.key || ''}"${align}>${col.label}${arrow}</th>`;
  }).join('') + '</tr>';
}

/** Active le clic sur les en-têtes pour changer le tri */
function bindSort(theadEl, state, onChange) {
  theadEl.querySelectorAll('th.sortable').forEach(th => {
    th.onclick = () => {
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortDir *= -1;
      else { state.sortKey = key; state.sortDir = 1; }
      onChange();
    };
  });
}

/* ---------- Vignette produit (photo ou initiale) ---------- */
function productThumb(p) {
  if (p.photo) return `<img class="thumb" src="${escapeHtml(p.photo)}" alt="">`;
  return `<span class="thumb-placeholder">${escapeHtml((p.name || '?').charAt(0).toUpperCase())}</span>`;
}
