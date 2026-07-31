/**
 * categories.js — CRUD des catégories (nom + description).
 */
(function categoriesPage() {
  const state = { rows: [], sortKey: 'name', sortDir: 1, page: 1 };
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const pagination = document.getElementById('pagination');

  const COLUMNS = [
    { key: 'name',          label: 'Nom' },
    { key: 'description',   label: 'Description' },
    { key: 'product_count', label: 'Produits', align: 'right' },
    { key: null,            label: 'Actions',  sortable: false, align: 'right' }
  ];

  async function load() {
    try {
      state.rows = await API.get('/categories');
      render();
    } catch (e) { showToast(e.message, 'error'); }
  }

  function render() {
    thead.innerHTML = renderTableHead(COLUMNS, state);
    bindSort(thead, state, render);

    const rows = sortRows(state.rows, state.sortKey, state.sortDir);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">
        ${ICONS.categories}<p>Aucune catégorie — créez-en une pour classer vos produits</p></div></td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageSlice(rows, state.page).map(c => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td class="muted">${escapeHtml(c.description || '—')}</td>
        <td class="text-right"><span class="badge badge-blue">${c.product_count}</span></td>
        <td><div class="actions">
          <button class="icon-btn" title="Modifier" onclick="editCategory(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteCategory(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div></td>
      </tr>`).join('');

    renderPagination(pagination, rows.length, state.page, p => { state.page = p; render(); });
  }

  function formHtml(c = {}) {
    return `
      <div class="form-group">
        <label class="required">Nom de la catégorie</label>
        <input type="text" id="f-name" value="${escapeHtml(c.name || '')}" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="f-description">${escapeHtml(c.description || '')}</textarea>
      </div>`;
  }

  function readForm(form) {
    const name = form.querySelector('#f-name').value.trim();
    if (!name) throw new Error('Le nom de la catégorie est obligatoire');
    return { name, description: form.querySelector('#f-description').value.trim() };
  }

  document.getElementById('btn-add').onclick = () => {
    openModal('Nouvelle catégorie', formHtml(), {
      submitLabel: 'Créer',
      onSubmit: async (form, modal) => {
        await API.post('/categories', readForm(form));
        modal.close();
        showToast('Catégorie créée ✔');
        load();
      }
    });
  };

  window.editCategory = (id) => {
    const c = state.rows.find(r => r.id === id);
    if (!c) return;
    openModal('Modifier la catégorie', formHtml(c), {
      onSubmit: async (form, modal) => {
        await API.put('/categories/' + id, readForm(form));
        modal.close();
        showToast('Catégorie modifiée ✔');
        load();
      }
    });
  };

  window.deleteCategory = async (id) => {
    const c = state.rows.find(r => r.id === id);
    const warn = c && c.product_count > 0
      ? `« ${c.name} » contient ${c.product_count} produit(s). Ils resteront sans catégorie. Supprimer ?`
      : `Supprimer la catégorie « ${c ? c.name : ''} » ?`;
    if (!await confirmDialog(warn)) return;
    try {
      await API.del('/categories/' + id);
      showToast('Catégorie supprimée');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  load();
})();
