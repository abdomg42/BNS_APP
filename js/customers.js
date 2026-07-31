/**
 * customers.js — CRUD des clients + recherche instantanée.
 */
(function customersPage() {
  const state = { rows: [], search: '', sortKey: 'name', sortDir: 1, page: 1 };
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const pagination = document.getElementById('pagination');

  const COLUMNS = [
    { key: 'name',    label: 'Nom' },
    { key: 'phone',   label: 'Téléphone' },
    { key: 'email',   label: 'Email' },
    { key: 'address', label: 'Adresse' },
    { key: null,      label: 'Actions', sortable: false, align: 'right' }
  ];

  async function load() {
    try {
      state.rows = await API.get('/customers');
      render();
    } catch (e) { showToast(e.message, 'error'); }
  }

  function filteredRows() {
    const q = state.search.toLowerCase();
    return state.rows.filter(c =>
      !q || c.name.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q));
  }

  function render() {
    thead.innerHTML = renderTableHead(COLUMNS, state);
    bindSort(thead, state, render);

    const rows = sortRows(filteredRows(), state.sortKey, state.sortDir);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
        ${ICONS.customers}<p>Aucun client trouvé</p></div></td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageSlice(rows, state.page).map(c => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.phone || '—')}</td>
        <td>${c.email ? `<a href="mailto:${escapeHtml(c.email)}" style="color:var(--blue)">${escapeHtml(c.email)}</a>` : '—'}</td>
        <td class="muted">${escapeHtml(c.address || '—')}</td>
        <td><div class="actions">
          <button class="icon-btn" title="Modifier" onclick="editCustomer(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteCustomer(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div></td>
      </tr>`).join('');

    renderPagination(pagination, rows.length, state.page, p => { state.page = p; render(); });
  }

  function formHtml(c = {}) {
    return `
      <div class="form-group">
        <label class="required">Nom complet</label>
        <input type="text" id="f-name" value="${escapeHtml(c.name || '')}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Téléphone</label>
          <input type="tel" id="f-phone" value="${escapeHtml(c.phone || '')}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="f-email" value="${escapeHtml(c.email || '')}">
        </div>
      </div>
      <div class="form-group">
        <label>Adresse</label>
        <textarea id="f-address">${escapeHtml(c.address || '')}</textarea>
      </div>`;
  }

  function readForm(form) {
    const data = {
      name: form.querySelector('#f-name').value.trim(),
      phone: form.querySelector('#f-phone').value.trim(),
      email: form.querySelector('#f-email').value.trim(),
      address: form.querySelector('#f-address').value.trim()
    };
    if (!data.name) throw new Error('Le nom du client est obligatoire');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Adresse email invalide');
    }
    return data;
  }

  document.getElementById('btn-add').onclick = () => {
    openModal('Nouveau client', formHtml(), {
      submitLabel: 'Créer',
      onSubmit: async (form, modal) => {
        await API.post('/customers', readForm(form));
        modal.close();
        showToast('Client créé ✔');
        load();
      }
    });
  };

  window.editCustomer = (id) => {
    const c = state.rows.find(r => r.id === id);
    if (!c) return;
    openModal('Modifier le client', formHtml(c), {
      onSubmit: async (form, modal) => {
        await API.put('/customers/' + id, readForm(form));
        modal.close();
        showToast('Client modifié ✔');
        load();
      }
    });
  };

  window.deleteCustomer = async (id) => {
    const c = state.rows.find(r => r.id === id);
    if (!await confirmDialog(`Supprimer le client « ${c ? c.name : ''} » ?`)) return;
    try {
      await API.del('/customers/' + id);
      showToast('Client supprimé');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  document.getElementById('search-input').addEventListener('input',
    debounce(e => { state.search = e.target.value; state.page = 1; render(); }, 200));

  load();
})();
