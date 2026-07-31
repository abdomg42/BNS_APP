/**
 * invoices.js — Liste des factures : création (validation = déstockage
 * automatique côté serveur), impression / export PDF, suppression.
 */
(function invoicesPage() {
  const state = { rows: [], sortKey: 'created_at', sortDir: -1, page: 1 };
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const pagination = document.getElementById('pagination');

  const COLUMNS = [
    { key: 'number',        label: 'N° Facture' },
    { key: 'customer_name', label: 'Client' },
    { key: 'total',         label: 'Total TTC', align: 'right' },
    { key: 'status',        label: 'Statut' },
    { key: 'created_at',    label: 'Date' },
    { key: null,            label: 'Actions', sortable: false, align: 'right' }
  ];

  async function load() {
    try {
      state.rows = await API.get('/invoices');
      render();
    } catch (e) { showToast(e.message, 'error'); }
  }

  function render() {
    thead.innerHTML = renderTableHead(COLUMNS, state);
    bindSort(thead, state, render);

    const rows = sortRows(state.rows, state.sortKey, state.sortDir);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        ${ICONS.invoices}<p>Aucune facture — cliquez sur « Nouvelle facture »</p></div></td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageSlice(rows, state.page).map(inv => `
      <tr>
        <td><strong>${escapeHtml(inv.number)}</strong></td>
        <td>${escapeHtml(inv.customer_name)}</td>
        <td class="text-right"><strong>${formatMoney(inv.total)}</strong></td>
        <td><span class="badge badge-green">${escapeHtml(inv.status)}</span></td>
        <td class="muted">${formatDate(inv.created_at)}</td>
        <td><div class="actions">
          <button class="icon-btn" title="Imprimer / PDF" onclick="printInvoice(${inv.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
          </button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteInvoice(${inv.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div></td>
      </tr>`).join('');

    renderPagination(pagination, rows.length, state.page, p => { state.page = p; render(); });
  }

  window.printInvoice = (id) => window.open(`print.html?type=invoice&id=${id}`, '_blank');

  window.deleteInvoice = async (id) => {
    const inv = state.rows.find(r => r.id === id);
    if (!await confirmDialog(
      `Supprimer la facture « ${inv ? inv.number : ''} » ? (les quantités déstockées ne seront PAS restaurées)`)) return;
    try {
      await API.del('/invoices/' + id);
      showToast('Facture supprimée');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  document.getElementById('btn-add').onclick = () =>
    openDocumentForm({
      title: 'Nouvelle facture',
      endpoint: '/invoices',
      submitLabel: 'Valider la facture',
      successMsg: 'Facture validée :',
      warnStock: true,
      onCreated: load
    });

  load();
})();
