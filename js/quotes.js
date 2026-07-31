/**
 * quotes.js — Liste des devis : création, changement de statut,
 * impression / export PDF, suppression.
 */
(function quotesPage() {
  const state = { rows: [], sortKey: 'created_at', sortDir: -1, page: 1 };
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const pagination = document.getElementById('pagination');

  const COLUMNS = [
    { key: 'number',        label: 'N° Devis' },
    { key: 'customer_name', label: 'Client' },
    { key: 'total',         label: 'Total TTC', align: 'right' },
    { key: 'status',        label: 'Statut' },
    { key: 'created_at',    label: 'Date' },
    { key: null,            label: 'Actions', sortable: false, align: 'right' }
  ];

  const STATUS_BADGES = {
    'en attente': 'badge-orange',
    'accepté': 'badge-green',
    'refusé': 'badge-red'
  };

  async function load() {
    try {
      state.rows = await API.get('/quotes');
      render();
    } catch (e) { showToast(e.message, 'error'); }
  }

  function render() {
    thead.innerHTML = renderTableHead(COLUMNS, state);
    bindSort(thead, state, render);

    const rows = sortRows(state.rows, state.sortKey, state.sortDir);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        ${ICONS.quotes}<p>Aucun devis — cliquez sur « Nouveau devis »</p></div></td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageSlice(rows, state.page).map(q => `
      <tr>
        <td><strong>${escapeHtml(q.number)}</strong></td>
        <td>${escapeHtml(q.customer_name)}</td>
        <td class="text-right"><strong>${formatMoney(q.total)}</strong></td>
        <td><span class="badge ${STATUS_BADGES[q.status] || 'badge-gray'}">${escapeHtml(q.status)}</span></td>
        <td class="muted">${formatDate(q.created_at)}</td>
        <td><div class="actions">
          <button class="icon-btn" title="Imprimer / PDF" onclick="printQuote(${q.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
          </button>
          <button class="icon-btn" title="Changer le statut" onclick="changeStatus(${q.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteQuote(${q.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div></td>
      </tr>`).join('');

    renderPagination(pagination, rows.length, state.page, p => { state.page = p; render(); });
  }

  /* ---------- Actions ---------- */
  window.printQuote = (id) => window.open(`print.html?type=quote&id=${id}`, '_blank');

  window.changeStatus = (id) => {
    const q = state.rows.find(r => r.id === id);
    if (!q) return;
    openModal(`Statut du devis ${q.number}`, `
      <div class="form-group">
        <label>Nouveau statut</label>
        <select id="f-status">
          ${['en attente', 'accepté', 'refusé'].map(s =>
            `<option value="${s}" ${q.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>`, {
      submitLabel: 'Mettre à jour',
      onSubmit: async (form, modal) => {
        await API.patch('/quotes/' + id + '/status', {
          status: form.querySelector('#f-status').value
        });
        modal.close();
        showToast('Statut mis à jour ✔');
        load();
      }
    });
  };

  window.deleteQuote = async (id) => {
    const q = state.rows.find(r => r.id === id);
    if (!await confirmDialog(`Supprimer le devis « ${q ? q.number : ''} » ?`)) return;
    try {
      await API.del('/quotes/' + id);
      showToast('Devis supprimé');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  document.getElementById('btn-add').onclick = () =>
    openDocumentForm({
      title: 'Nouveau devis',
      endpoint: '/quotes',
      submitLabel: 'Créer le devis',
      successMsg: 'Devis créé :',
      onCreated: load
    });

  load();
})();
