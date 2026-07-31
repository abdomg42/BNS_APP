/**
 * stock.js — Mouvements de stock : entrées/sorties, historique,
 * alertes quand quantité ≤ stock minimum.
 */
(function stockPage() {
  const state = { movements: [], products: [], sortKey: 'created_at', sortDir: -1, page: 1 };
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const pagination = document.getElementById('pagination');
  const productSelect = document.getElementById('mov-product');

  const COLUMNS = [
    { key: 'created_at',   label: 'Date' },
    { key: 'product_name', label: 'Produit' },
    { key: 'type',         label: 'Type' },
    { key: 'quantity',     label: 'Quantité', align: 'right' },
    { key: 'reason',       label: 'Motif' }
  ];

  /* ---------- Chargement ---------- */
  async function load() {
    try {
      [state.products, state.movements] = await Promise.all([
        API.get('/products'),
        API.get('/stock/movements')
      ]);
      productSelect.innerHTML = state.products.map(p =>
        `<option value="${p.id}">${escapeHtml(p.name)} (stock : ${p.quantity})</option>`).join('');
      renderAlerts();
      render();
    } catch (e) { showToast(e.message, 'error'); }
  }

  /* ---------- Alertes ---------- */
  function renderAlerts() {
    const low = state.products.filter(p => p.quantity <= p.min_stock);
    const card = document.getElementById('alerts-card');
    const list = document.getElementById('alerts-list');
    if (low.length === 0) { card.style.display = 'none'; return; }
    card.style.display = '';
    list.innerHTML = low.map(p => `
      <div class="low-stock-item ${p.quantity === 0 ? 'critical' : ''}">
        <div style="display:flex;align-items:center;gap:12px">
          ${productThumb(p)}
          <div><strong>${escapeHtml(p.name)}</strong>
          <div class="muted">Stock : ${p.quantity} · Minimum : ${p.min_stock}</div></div>
        </div>
        <span class="badge ${p.quantity === 0 ? 'badge-red' : 'badge-orange'}">
          ${p.quantity === 0 ? 'Rupture de stock' : 'Stock faible'}
        </span>
      </div>`).join('');
  }

  /* ---------- Historique ---------- */
  function render() {
    thead.innerHTML = renderTableHead(COLUMNS, state);
    bindSort(thead, state, render);

    const rows = sortRows(state.movements, state.sortKey, state.sortDir);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
        ${ICONS.stock}<p>Aucun mouvement enregistré</p></div></td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageSlice(rows, state.page).map(m => `
      <tr>
        <td class="muted">${formatDate(m.created_at)}</td>
        <td><strong>${escapeHtml(m.product_name)}</strong></td>
        <td>${m.type === 'entree'
          ? '<span class="badge badge-green">Entrée</span>'
          : '<span class="badge badge-red">Sortie</span>'}</td>
        <td class="text-right ${m.type === 'entree' ? 'text-success' : 'text-danger'}">
          ${m.type === 'entree' ? '+' : '−'}${m.quantity}</td>
        <td class="muted">${escapeHtml(m.reason || '—')}</td>
      </tr>`).join('');

    renderPagination(pagination, rows.length, state.page, p => { state.page = p; render(); });
  }

  /* ---------- Nouveau mouvement ---------- */
  document.getElementById('movement-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      product_id: Number(productSelect.value),
      type: document.getElementById('mov-type').value,
      quantity: parseInt(document.getElementById('mov-quantity').value, 10) || 0,
      reason: document.getElementById('mov-reason').value.trim()
    };
    if (!payload.product_id) return showToast('Choisissez un produit', 'error');
    if (payload.quantity <= 0) return showToast('La quantité doit être supérieure à 0', 'error');

    try {
      const res = await API.post('/stock/movements', payload);
      showToast(`Mouvement enregistré — nouveau stock : ${res.product.quantity} ✔`);
      // Alerte immédiate si le minimum est atteint
      if (res.lowStock) {
        showToast(`⚠ Attention : « ${res.product.name} » a atteint son stock minimum !`, 'error');
      }
      document.getElementById('mov-quantity').value = 1;
      document.getElementById('mov-reason').value = '';
      load();
    } catch (err) { showToast(err.message, 'error'); }
  });

  load();
})();
