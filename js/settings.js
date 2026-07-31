/**
 * settings.js — Paramètres de l'entreprise : infos, logo (avec aperçu),
 * TVA et devise. Enregistrement via PUT /api/settings.
 */
(function settingsPage() {
  const form = document.getElementById('settings-form');
  const preview = document.getElementById('logo-preview');
  let logoData = null; // logo en base64 en attente d'envoi

  /* Charger les valeurs actuelles dans le formulaire */
  function fill() {
    const s = window.APP_SETTINGS || {};
    form.querySelector('#company_name').value = s.company_name || '';
    form.querySelector('#company_address').value = s.company_address || '';
    form.querySelector('#company_phone').value = s.company_phone || '';
    form.querySelector('#company_email').value = s.company_email || '';
    form.querySelector('#tva_rate').value = s.tva_rate || '20';
    form.querySelector('#currency').value = s.currency || 'MAD';
    if (s.company_logo) preview.innerHTML = `<img src="${escapeHtml(s.company_logo)}">`;
  }

  /* Aperçu du nouveau logo choisi */
  form.querySelector('#company_logo_file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      logoData = await fileToBase64(file);
      preview.innerHTML = `<img src="${logoData}">`;
    } catch (err) {
      showToast(err.message, 'error');
      e.target.value = '';
    }
  });

  /* Enregistrement */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const tva = Number(form.querySelector('#tva_rate').value);
    if (isNaN(tva) || tva < 0 || tva > 100) {
      return showToast('Taux de TVA invalide (0 à 100)', 'error');
    }
    const payload = {
      company_name: form.querySelector('#company_name').value.trim(),
      company_address: form.querySelector('#company_address').value.trim(),
      company_phone: form.querySelector('#company_phone').value.trim(),
      company_email: form.querySelector('#company_email').value.trim(),
      tva_rate: tva,
      currency: form.querySelector('#currency').value
    };
    if (!payload.company_name) return showToast('Le nom de l\'entreprise est obligatoire', 'error');
    if (logoData) payload.company_logo_data = logoData;

    try {
      window.APP_SETTINGS = await API.put('/settings', payload);
      showToast('Paramètres enregistrés ✔ — rechargement…');
      setTimeout(() => location.reload(), 900); // met à jour logo + devise partout
    } catch (err) { showToast(err.message, 'error'); }
  });

  // APP_SETTINGS est chargé par app.js ; attendre qu'il soit prêt
  const wait = setInterval(() => {
    if (window.APP_SETTINGS) { clearInterval(wait); fill(); }
  }, 100);
})();
