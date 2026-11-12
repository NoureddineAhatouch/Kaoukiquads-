/* Avis Google : badge du hero + titre de la section Elfsight.
   Les valeurs viennent de content.json (réglages du panneau admin). */
(function () {
  const el = document.getElementById('gReviews');
  const section = document.getElementById('avis');
  let cfg = { rating: 0, count: 0, show: true };
  let texts = {};

  const L = () => (siteTranslations[document.documentElement.lang] ? document.documentElement.lang : 'fr');
  const T = () => Object.assign({}, siteTranslations[L()], texts[L()] || {});

  function render() {
    const t = T();
    if (el) {
      const score = el.querySelector('.g-score'), label = el.querySelector('.g-label');
      if (cfg.rating > 0) {
        score.hidden = false; score.textContent = cfg.rating.toFixed(1);
        label.textContent = '· ' + (cfg.count > 0 ? cfg.count + ' ' : '') + t.gLabel;
      } else { score.hidden = true; label.textContent = t.gNone; }
    }
    const e = document.getElementById('rvEyebrow'), h = document.getElementById('rvTitle');
    if (e) e.innerHTML = t.reviewsEyebrow; if (h) h.innerHTML = t.reviewsTitle;
    if (section) section.hidden = !cfg.show;
  }

  render();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  fetch('content.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((c) => {
    if (!c) return;
    const s = c.settings || {};
    cfg = { rating: Number(s.googleRating) || 0, count: Number(s.googleCount) || 0, show: s.showReviews !== false };
    texts = c.texts || {};
    render();
  }).catch(() => {});
})();
