/**
 * print.js — Génère le document imprimable (devis ou facture) :
 * en-tête logo BNS + titre, encadré Objet / Client, numéro centré,
 * tableau avec Total / TVA / Remise / Total TTC intégrés,
 * montant en toutes lettres, mode de paiement (style facture classique manuscrite).
 * URL : print.html?type=quote&id=1  ou  print.html?type=invoice&id=1
 * « Télécharger PDF » = téléchargement direct (html2pdf, sans boîte d'impression).
 */

/* ---------- Nombre en toutes lettres (français) ---------- */
function numberToWordsFr(n) {
  const U = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix',
             'onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  const T = ['','dix','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  const under100 = x => {
    if (x < 20) return U[x];
    const t = Math.floor(x / 10), r = x % 10;
    if (t === 7 || t === 9) return T[t] + (r === 1 && t === 7 ? ' et onze' : '-' + U[10 + r]);
    if (r === 0) return T[t] + (t === 8 ? 's' : '');
    if (r === 1 && t !== 8) return T[t] + ' et un';
    return T[t] + '-' + U[r];
  };
  const under1000 = x => {
    const h = Math.floor(x / 100), r = x % 100;
    let s = '';
    if (h > 0) s = (h > 1 ? U[h] + ' cent' : 'cent') + (r === 0 && h > 1 ? 's' : '');
    if (r > 0) s += (s ? ' ' : '') + under100(r);
    return s;
  };
  if (n === 0) return U[0];
  const m = Math.floor(n / 1e6), k = Math.floor((n % 1e6) / 1000), r = n % 1000;
  const parts = [];
  if (m) parts.push(m === 1 ? 'un million' : under1000(m) + ' millions');
  if (k) parts.push(k === 1 ? 'mille' : under1000(k) + ' mille');
  if (r) parts.push(under1000(r));
  return parts.join(' ');
}

/** Montant en lettres majuscules + devise : "NEUF MILLE ... DIRHAMS" */
function amountInWords(amount, currency) {
  const names = { MAD: 'DIRHAMS', EUR: 'EUROS', USD: 'DOLLARS' };
  const label = names[currency] || currency || 'DIRHAMS';
  const cents = Math.round((Number(amount) || 0) * 100);
  const int = Math.floor(cents / 100), rem = cents % 100;
  let words = numberToWordsFr(int) + ' ' + label;
  if (rem) words += ' ET ' + numberToWordsFr(rem) + ' CENTIMES';
  return words.toUpperCase().replace(/-/g, ' ');
}

/* ---------- Téléchargement direct du PDF ---------- */
let PDF_FILENAME = 'document.pdf';

function downloadPDF() {
  const btn = document.getElementById('btn-pdf');
  const sheet = document.getElementById('sheet');
  btn.disabled = true;
  const oldLabel = btn.textContent;
  btn.textContent = 'Génération…';
  html2pdf().set({
    margin: 10,
    filename: PDF_FILENAME,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(sheet).save().finally(() => {
    btn.disabled = false;
    btn.textContent = oldLabel;
  });
}

/* ---------- Construction du document ---------- */
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
    PDF_FILENAME = String(doc.number).replace(/[\\/:*?"<>|]/g, '-') + '.pdf';

    const title = type === 'quote' ? 'DEVIS' : 'FACTURE';
    const logo = settings.company_logo || '/uploads/images/logo.png';
    const currency = settings.currency || 'MAD';
    const cityLabel = settings.company_city || 'Casablanca';
    const docDate = new Date(String(doc.created_at).replace(' ', 'T'))
      .toLocaleDateString('fr-FR');

    // Objet (texte libre au-dessus du tableau, façon bon de commande)
    const objet = doc.objet || doc.notes || "Achat d'équipement";

    // Remise (optionnelle) — si absente, le total TTC reste doc.total
    const subtotal = Number(doc.subtotal) || 0;
    const tvaAmount = Number(doc.tva_amount) || 0;
    const remise = Number(doc.remise) || 0;
    const totalTTC = remise ? (subtotal + tvaAmount - remise) : Number(doc.total) || 0;

    // Mode de règlement (optionnel — n'apparaît que sur les factures)
    let paymentLine = '';
    if (type === 'invoice' && doc.payment_method) {
      const method = escapeHtml(doc.payment_method).toUpperCase();
      const ref = doc.payment_reference ? ' N°' + escapeHtml(doc.payment_reference) : '';
      paymentLine = `<div class="payment-line">PAYÉ PAR ${method}${ref}</div>`;
    }

    const tagline = escapeHtml(settings.company_tagline || 'Exiger la qualité');
    const companyPhone = escapeHtml(settings.company_phone || '+212 667 618 344');
    const companyEmail = escapeHtml(settings.company_email || 'bnsport.1440@gmail.com');

    sheet.innerHTML = `
    
    <div class="doc-header">
    <div class="company-left">
    <img src="${escapeHtml(logo)}" alt="Logo" class="big-logo" onerror="this.style.display='none'">
          <div class="company-name">BNS SPORT</div>
          <div class="company-tagline">${tagline}</div>
          <div class="company-contact">
            TEL: ${companyPhone}<br>
            E-mail: ${companyEmail}
          </div>
        </div>
        <div class="client-right">
        <table class="client-table">
            <tr><td class="client-label">Client</td><td class="client-value">${escapeHtml(doc.customer_name)}</td></tr>
            </table>
            </div>
            </div>
            
            <div class="doc-date">${escapeHtml(cityLabel)} le : <strong>${docDate}</strong></div>
      <div class="doc-number">${title} N° : ${escapeHtml(doc.number)}</div>

      <table>
        <thead><tr>
          <th class="col-u">U</th><th>Désignation</th><th class="col-price">Prix d'unité</th><th class="col-amount">MONTANT</th>
        </tr></thead>
        <tbody>
          ${doc.items.map(it => `<tr>
            <td class="col-u">${it.quantity}</td>
            <td>${escapeHtml(it.product_name)}</td>
            <td class="col-price">${formatMoney(it.unit_price)}</td>
            <td class="col-amount">${formatMoney(it.total)}</td>
          </tr>`).join('')}
          <tr class="totals-row">
            <td colspan="2" class="totals-blank"></td>
            <td class="totals-label">TOTAL</td>
            <td class="col-amount">${formatMoney(subtotal)}</td>
          </tr>
          <tr class="totals-row">
            <td colspan="2" class="totals-blank"></td>
            <td class="totals-label">TVA ${doc.tva_rate}%</td>
            <td class="col-amount">${formatMoney(tvaAmount)}</td>
          </tr>
          ${remise ? `<tr class="totals-row">
            <td colspan="2" class="totals-blank"></td>
            <td class="totals-label">REMISE</td>
            <td class="col-amount">${formatMoney(remise)}</td>
          </tr>` : ''}
          <tr class="grand-row">
            <td colspan="3" class="grand-label">Total TTC</td>
            <td class="col-amount grand-amount">${formatMoney(totalTTC)}</td>
          </tr>
        </tbody>
      </table>

      <div class="in-words">
        <span class="lbl">Arrêté${type === 'invoice' ? 'e' : ''} ${type === 'invoice' ? 'la présente facture' : 'le présent devis'} à la somme de :</span><br>
        <span class="words">${amountInWords(totalTTC, currency)} TTC</span>
      </div>

      ${paymentLine}

      <div class="doc-footer">
        ${escapeHtml(settings.company_name || '')} SARL AU CAPITAL DE ${escapeHtml(settings.company_capital || '100.000')} Dh
       ${escapeHtml(settings.company_address || '')} <br>
        ${settings.company_phone ? 'gsm ' + escapeHtml(settings.company_phone) : ''}
        Boulevard Modibo keita N° 16 ( en Face de Cinema El baida) - Casablanca Maroc
        ${settings.company_patente ? ' - Patente : ' + escapeHtml(settings.company_patente) : ''}
      </div>`;

    // Ouvre automatiquement la boîte d'impression après chargement des images
    setTimeout(() => window.print(), 600);
  } catch (e) {
    sheet.innerHTML = `<p style="padding:40px;text-align:center">Erreur : ${escapeHtml(e.message)}</p>`;
  }
})();