/**
 * products.js — CRUD produits : recherche instantanée, filtre par
 * catégorie, tri des colonnes, pagination, photo avec aperçu.
 */
(function productsPage() {
  const state = {
    rows: [],           // tous les produits
    categories: [],
    search: '',
    categoryId: '',
    sortKey: 'name',
    sortDir: 1,
    page: 1,
    photoData: null     // image en base64 en attente d'envoi
  };

  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const pagination = document.getElementById('pagination');

  const COLUMNS = [
    { key: null,            label: 'Photo',    sortable: false },
    { key: 'name',          label: 'Nom' },
    { key: 'category_name', label: 'Catégorie' },
    { key: 'purchase_price',label: 'Prix achat', align: 'right' },
    { key: 'sale_price',    label: 'Prix vente', align: 'right' },
    { key: 'quantity',      label: 'Stock',      align: 'right' },
    { key: 'min_stock',     label: 'Min',        align: 'right' },
    { key: null,            label: 'Actions',    sortable: false, align: 'right' }
  ];

  /* ---------- Chargement ---------- */
  async function load() {
    try {
      [state.rows, state.categories] = await Promise.all([
        API.get('/products'),
        API.get('/categories')
      ]);
      const filter = document.getElementById('category-filter');
      filter.innerHTML = '<option value="">Toutes les catégories</option>' +
        state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
      render();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  /* ---------- Rendu ---------- */
  function filteredRows() {
    const q = state.search.toLowerCase();
    return state.rows.filter(p =>
      (!q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) &&
      (!state.categoryId || String(p.category_id) === state.categoryId)
    );
  }

  function render() {
    thead.innerHTML = renderTableHead(COLUMNS, state);
    bindSort(thead, state, render);

    const rows = sortRows(filteredRows(), state.sortKey, state.sortDir);

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        ${ICONS.products}<p>Aucun produit trouvé</p></div></td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageSlice(rows, state.page).map(p => {
      const low = p.quantity <= p.min_stock;
      return `
      <tr class="${low ? 'row-low' : ''}">
        <td>${productThumb(p)}</td>
        <td><strong>${escapeHtml(p.name)}</strong>
            ${p.description ? `<div class="muted">${escapeHtml(p.description.slice(0, 50))}</div>` : ''}</td>
        <td>${p.category_name ? `<span class="badge badge-blue">${escapeHtml(p.category_name)}</span>` : '<span class="muted">—</span>'}</td>
        <td class="text-right">${formatMoney(p.purchase_price)}</td>
        <td class="text-right">${formatMoney(p.sale_price)}</td>
        <td class="text-right">${low ? `<span class="badge badge-red">${p.quantity}</span>` : `<span class="badge badge-green">${p.quantity}</span>`}</td>
        <td class="text-right muted">${p.min_stock}</td>
        <td><div class="actions">
          <button class="icon-btn" title="Modifier" onclick="editProduct(${p.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteProduct(${p.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div></td>
      </tr>`;
    }).join('');

    renderPagination(pagination, rows.length, state.page, p => { state.page = p; render(); });
  }

  /* ---------- Formulaire (création / édition) ---------- */
  function formHtml(p = {}) {
    return `
      <div class="form-group">
        <label>Photo du produit</label>
        <div style="display:flex;align-items:center;gap:14px">
          <div class="img-preview" id="photo-preview">
            ${p.photo ? `<img src="${escapeHtml(p.photo)}">` : '<span>Aucune image</span>'}
          </div>
          <input type="file" id="photo_file" accept="image/*" style="max-width:260px">
        </div>
      </div>
      <div class="form-group">
        <label class="required">Nom du produit</label>
        <input type="text" id="f-name" value="${escapeHtml(p.name || '')}" required>
      </div>
      <div class="form-group">
        <label>Catégorie</label>
        <select id="f-category">
          <option value="">— Sans catégorie —</option>
          ${state.categories.map(c =>
            `<option value="${c.id}" ${p.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="f-description">${escapeHtml(p.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="required">Prix d'achat</label>
          <input type="number" id="f-purchase" min="0" step="0.01" value="${p.purchase_price ?? 0}" required>
        </div>
        <div class="form-group">
          <label class="required">Prix de vente</label>
          <input type="number" id="f-sale" min="0" step="0.01" value="${p.sale_price ?? 0}" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="required">Quantité en stock</label>
          <input type="number" id="f-quantity" min="0" value="${p.quantity ?? 0}" required>
        </div>
        <div class="form-group">
          <label>Stock minimum (alerte)</label>
          <input type="number" id="f-min" min="0" value="${p.min_stock ?? 0}">
        </div>
      </div>`;
  }

  function readForm(form) {
    const data = {
      name: form.querySelector('#f-name').value.trim(),
      category_id: form.querySelector('#f-category').value || null,
      description: form.querySelector('#f-description').value.trim(),
      purchase_price: Number(form.querySelector('#f-purchase').value),
      sale_price: Number(form.querySelector('#f-sale').value),
      quantity: parseInt(form.querySelector('#f-quantity').value, 10) || 0,
      min_stock: parseInt(form.querySelector('#f-min').value, 10) || 0
    };
    if (!data.name) throw new Error('Le nom du produit est obligatoire');
    if (state.photoData) data.photo_data = state.photoData;
    return data;
  }

  /** Branche l'aperçu de la photo choisie */
  function bindPhotoInput(form) {
    state.photoData = null; // réinitialise la photo en attente
    const input = form.querySelector('#photo_file');
    const preview = form.querySelector('#photo-preview');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        state.photoData = await fileToBase64(file);
        preview.innerHTML = `<img src="${state.photoData}">`;
      } catch (e) { showToast(e.message, 'error'); input.value = ''; }
    });
  }

  window.editProduct = (id) => {
    const p = state.rows.find(r => r.id === id);
    if (!p) return;
    const modal = openModal('Modifier le produit', formHtml(p), {
      submitLabel: 'Enregistrer',
      onSubmit: async (form, m) => {
        const data = readForm(form);
        if (!state.photoData) data.photo = p.photo; // conserve l'ancienne photo
        await API.put('/products/' + id, data);
        m.close();
        showToast('Produit modifié ✔');
        load();
      }
    });
    bindPhotoInput(modal.querySelector('.modal-form'));
  };

  window.deleteProduct = async (id) => {
    const p = state.rows.find(r => r.id === id);
    const ok = await confirmDialog(`Supprimer définitivement « ${p ? p.name : ''} » ?`);
    if (!ok) return;
    try {
      await API.del('/products/' + id);
      showToast('Produit supprimé');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  /* ---------- Événements ---------- */
  document.getElementById('btn-add').onclick = () => {
    const modal = openModal('Nouveau produit', formHtml(), {
      submitLabel: 'Créer le produit',
      onSubmit: async (form, m) => {
        await API.post('/products', readForm(form));
        m.close();
        showToast('Produit créé ✔');
        load();
      }
    });
    bindPhotoInput(modal.querySelector('.modal-form'));
  };

  document.getElementById('search-input').addEventListener('input',
    debounce(e => { state.search = e.target.value; state.page = 1; render(); }, 200));

  document.getElementById('category-filter').addEventListener('change',
    e => { state.categoryId = e.target.value; state.page = 1; render(); });

  load();
})();
