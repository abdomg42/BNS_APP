/**
 * documentForm.js — Formulaire commun aux devis et aux factures :
 * choix du client, lignes de produits, calcul automatique
 * sous-total / TVA / total TTC.
 */

/**
 * Ouvre la modale de création d'un document.
 * @param {object} cfg
 *   cfg.title    'Nouveau devis' | 'Nouvelle facture'
 *   cfg.endpoint '/quotes' | '/invoices'
 *   cfg.onCreated callback(doc) après succès
 */
async function openDocumentForm(cfg) {
  // Charger clients + produits en parallèle
  const [customers, products] = await Promise.all([
    API.get('/customers'),
    API.get('/products')
  ]);
  if (customers.length === 0) {
    showToast('Créez d\'abord un client (page Clients)', 'error');
    return;
  }
  if (products.length === 0) {
    showToast('Créez d\'abord un produit (page Produits)', 'error');
    return;
  }

  const tvaRate = Number(window.APP_SETTINGS.tva_rate) || 0;
  let lines = []; // {product_id, quantity}

  const bodyHtml = `
    <div class="form-group">
      <label class="required">Client</label>
      <select id="doc-customer">
        ${customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="required">Produits</label>
      <div id="doc-lines"></div>
      <button type="button" class="btn btn-outline btn-sm" id="doc-add-line">+ Ajouter une ligne</button>
    </div>
    <div class="doc-totals">
      <div class="total-row"><span>Sous-total HT</span><strong id="doc-subtotal">—</strong></div>
      <div class="total-row"><span>TVA (${tvaRate} %)</span><strong id="doc-tva">—</strong></div>
      <div class="total-row grand"><span>Total TTC</span><span id="doc-total">—</span></div>
    </div>
    ${cfg.warnStock ? `<p class="muted" style="margin-top:10px">⚠ À la validation, les quantités seront automatiquement déduites du stock.</p>` : ''}`;

  const modal = openModal(cfg.title, bodyHtml, {
    large: true,
    submitLabel: cfg.submitLabel || 'Enregistrer',
    onSubmit: async () => {
      if (lines.length === 0) throw new Error('Ajoutez au moins un produit');
      const payload = {
        customer_id: Number(modal.querySelector('#doc-customer').value),
        tva_rate: tvaRate,
        items: lines.map(l => ({ product_id: l.product_id, quantity: l.quantity }))
      };
      const doc = await API.post(cfg.endpoint, payload);
      modal.close();
      showToast(cfg.successMsg + ' ' + doc.number + ' ✔');
      if (cfg.onCreated) cfg.onCreated(doc);
    }
  });

  const linesEl = modal.querySelector('#doc-lines');

  /* Recalcule les totaux à chaque changement */
  function refreshTotals() {
    const subtotal = lines.reduce((s, l) => {
      const p = products.find(x => x.id === l.product_id);
      return s + (p ? p.sale_price * l.quantity : 0);
    }, 0);
    const tva = subtotal * tvaRate / 100;
    modal.querySelector('#doc-subtotal').textContent = formatMoney(subtotal);
    modal.querySelector('#doc-tva').textContent = formatMoney(tva);
    modal.querySelector('#doc-total').textContent = formatMoney(subtotal + tva);
  }

  /* Affiche les lignes de produits */
  function renderLines() {
    linesEl.innerHTML = lines.map((line, i) => {
      const p = products.find(x => x.id === line.product_id);
      return `
      <div class="doc-line" data-i="${i}">
        <select class="line-product">
          ${products.map(x => `
            <option value="${x.id}" ${x.id === line.product_id ? 'selected' : ''}>
              ${escapeHtml(x.name)} — ${formatMoney(x.sale_price)} (stock : ${x.quantity})
            </option>`).join('')}
        </select>
        <input type="number" class="line-qty" min="1" ${p ? `max="${Math.max(p.quantity, 1)}"` : ''}
               value="${line.quantity}" title="Quantité">
        <strong class="line-total text-right">${p ? formatMoney(p.sale_price * line.quantity) : '—'}</strong>
        <button type="button" class="icon-btn danger line-del" title="Retirer">&times;</button>
      </div>`;
    }).join('');
    refreshTotals();
  }

  // Délégation d'événements sur les lignes
  linesEl.addEventListener('change', e => {
    const row = e.target.closest('.doc-line');
    if (!row) return;
    const i = Number(row.dataset.i);
    if (e.target.classList.contains('line-product')) {
      lines[i].product_id = Number(e.target.value);
      renderLines();
    }
    if (e.target.classList.contains('line-qty')) {
      lines[i].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
      renderLines();
    }
  });
  linesEl.addEventListener('click', e => {
    const btn = e.target.closest('.line-del');
    if (!btn) return;
    lines.splice(Number(btn.closest('.doc-line').dataset.i), 1);
    renderLines();
  });

  modal.querySelector('#doc-add-line').onclick = () => {
    lines.push({ product_id: products[0].id, quantity: 1 });
    renderLines();
  };

  // Une première ligne par défaut
  lines.push({ product_id: products[0].id, quantity: 1 });
  renderLines();
}
