/**
 * print.js — Génère le document imprimable (devis ou facture) :
 * structure avec logo BNS, infos entreprise, client, lignes, totaux.
 * URL : print.html?type=quote&id=1  ou  print.html?type=invoice&id=1
 * « Enregistrer en PDF » = Imprimer → Destination : Enregistrer au format PDF.
 */
(async function printPage() {
  const params = new URLSearchParams(location.search);
  const type = params.get('type');            // 'quote' | 'invoice'
  const id = params.get('id');
  const sheet = document.getElementById('sheet');

  if (!['quote', 'invoice'].includes(type) || !id) {
    sheet.innerHTML = '<p style="padding:40px;text-align:center">Paramètres invalides.</p>';
    return;
  }

  try {
    const [doc, settings] = await Promise.all([
      API.get(`/${type === 'quote' ? 'quotes' : 'invoices'}/${id}`),
      API.get('/settings')
    ]);
    document.title = `${doc.number} — ${settings.company_name || 'BNS'}`;
    window.APP_SETTINGS = settings; // utilisé par formatMoney()

    const title = type === 'quote' ? 'DEVIS' : 'FACTURE';
    const logo = settings.company_logo || '/uploads/images/logo.png';

    sheet.innerHTML = `
      <div class="doc-header">
        <img src="${escapeHtml(logo)}" alt="Logo" onerror="this.style.display='none'">
        <div class="company">
          <strong>${escapeHtml(settings.company_name || '')}</strong><br>
          ${escapeHtml(settings.company_address || '').replace(/\n/g, '<br>')}<br>
          ${settings.company_phone ? 'Tél : ' + escapeHtml(settings.company_phone) + '<br>' : ''}
          ${settings.company_email ? escapeHtml(settings.company_email) : ''}
        </div>
      </div>

      <div class="doc-title">${title}</div>
      <div class="doc-number">N° <strong>${escapeHtml(doc.number)}</strong> — ${formatDate(doc.created_at)}</div>

      <div class="parties">
        <div class="party">
          <h4>Émetteur</h4>
          <strong>${escapeHtml(settings.company_name || '')}</strong><br>
          ${escapeHtml(settings.company_address || '').replace(/\n/g, '<br>')}
        </div>
        <div class="party">
          <h4>Client</h4>
          <strong>${escapeHtml(doc.customer_name)}</strong><br>
          ${doc.customer_address ? escapeHtml(doc.customer_address).replace(/\n/g, '<br>') + '<br>' : ''}
          ${doc.customer_phone ? 'Tél : ' + escapeHtml(doc.customer_phone) + '<br>' : ''}
          ${doc.customer_email ? escapeHtml(doc.customer_email) : ''}
        </div>
      </div>

      <table>
        <thead><tr>
          <th>Désignation</th><th>Prix unitaire</th><th>Qté</th><th>Total</th>
        </tr></thead>
        <tbody>
          ${doc.items.map(it => `<tr>
            <td>${escapeHtml(it.product_name)}</td>
            <td>${formatMoney(it.unit_price)}</td>
            <td>${it.quantity}</td>
            <td>${formatMoney(it.total)}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Sous-total HT</span><span>${formatMoney(doc.subtotal)}</span></div>
        <div class="row"><span>TVA (${doc.tva_rate} %)</span><span>${formatMoney(doc.tva_amount)}</span></div>
        <div class="row grand"><span>Total TTC</span><span>${formatMoney(doc.total)}</span></div>
      </div>

      <div class="doc-footer">
        ${escapeHtml(settings.company_name || '')} — Document généré par BNS Stock Manager
        ${type === 'quote' ? '<br>Devis valable 30 jours sauf mention contraire.' : ''}
      </div>`;

    // Ouvre automatiquement la boîte d'impression après chargement des images
    setTimeout(() => window.print(), 600);
  } catch (e) {
    sheet.innerHTML = `<p style="padding:40px;text-align:center">Erreur : ${escapeHtml(e.message)}</p>`;
  }
})();
