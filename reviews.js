/* Avis Google Maps — badge du hero
   1) Mode simple : renseignez rating + count (copiez-les depuis votre fiche Google Maps).
   2) Mode automatique : renseignez placeId + apiKey (Google Places API) pour une mise à jour en direct. */
const GOOGLE_REVIEWS = {
  rating: 0,      // ex: 4.9
  count: 0,       // ex: 120
  placeId: '',    // ex: 'ChIJ...'
  apiKey: ''      // clé Places API (restreinte à votre domaine)
};

(function () {
  const el = document.getElementById('gReviews');
  if (!el) return;
  const score = el.querySelector('.g-score');
  const label = el.querySelector('.g-label');
  const T = {
    fr: { none: 'Voir nos avis Google', reviews: 'avis Google' },
    en: { none: 'See our Google reviews', reviews: 'Google reviews' },
    es: { none: 'Ver nuestras reseñas en Google', reviews: 'reseñas en Google' }
  };
  const data = { rating: Number(GOOGLE_REVIEWS.rating) || 0, count: Number(GOOGLE_REVIEWS.count) || 0 };

  function render() {
    const lang = T[document.documentElement.lang] ? document.documentElement.lang : 'fr';
    if (data.rating > 0) {
      score.hidden = false;
      score.textContent = data.rating.toFixed(1);
      label.textContent = data.count > 0 ? '· ' + data.count + ' ' + T[lang].reviews : '· ' + T[lang].reviews;
      el.setAttribute('aria-label', data.rating.toFixed(1) + '/5 — ' + (data.count || '') + ' ' + T[lang].reviews);
    } else {
      score.hidden = true;
      label.textContent = T[lang].none;
    }
  }

  async function loadLive() {
    if (!GOOGLE_REVIEWS.placeId || !GOOGLE_REVIEWS.apiKey) return;
    try {
      const r = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(GOOGLE_REVIEWS.placeId) +
        '?fields=rating,userRatingCount&key=' + encodeURIComponent(GOOGLE_REVIEWS.apiKey));
      if (!r.ok) return;
      const j = await r.json();
      if (j.rating) { data.rating = j.rating; data.count = j.userRatingCount || 0; render(); }
    } catch (e) { /* garde les valeurs statiques */ }
  }

  render();
  loadLive();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  const RV = {
    fr: ['AVIS CLIENTS', 'Ils ont roulé<br>avec <em>nous.</em>'],
    en: ['CUSTOMER REVIEWS', 'They rode<br>with <em>us.</em>'],
    es: ['OPINIONES', 'Ya rodaron<br>con <em>nosotros.</em>']
  };
  function renderSection() {
    const lang = RV[document.documentElement.lang] ? document.documentElement.lang : 'fr';
    const e = document.getElementById('rvEyebrow'), t = document.getElementById('rvTitle');
    if (e) e.textContent = RV[lang][0];
    if (t) t.innerHTML = RV[lang][1];
  }
  renderSection();
  new MutationObserver(renderSection).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
