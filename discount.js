/* Promotion : lit content.json lui-même, donc indépendant de app.js et style.css. */
(function () {
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  var defaults = [{ solo: 300, duo: 450 }, { solo: 550, duo: 750 }, { solo: 800, duo: 1000 }, { solo: 1300, duo: 1550 }];
  fetch('content.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
    if (!c) return;
    var s = c.settings || {}, pct = Number(s.discountPercent);
    var on = s.discountEnabled === true && pct > 0 && pct < 100;
    var badge = document.getElementById('discount-badge');
    if (!on) { if (badge) badge.remove(); return; }

    if (!badge) { badge = document.createElement('div'); badge.id = 'discount-badge'; document.body.appendChild(badge); }
    badge.textContent = '-' + pct + '%';
    var big = window.innerWidth >= 900;
    badge.style.cssText = 'position:fixed;z-index:9999;top:' + (big ? 104 : 90) + 'px;left:' + (big ? 24 : 14) + 'px;display:grid;place-items:center;width:' + (big ? 84 : 68) + 'px;height:' + (big ? 84 : 68) + 'px;border-radius:50%;background:#c9f0d3;border:2px solid #8fd6a5;color:#0b5d2a;font:800 ' + (big ? 30 : 24) + 'px/1 "Barlow Condensed",Arial,sans-serif;box-shadow:0 8px 22px rgba(11,93,42,.28);pointer-events:none';

    document.querySelectorAll('.price-card').forEach(function (card, i) {
      var p = Object.assign({}, defaults[i] || {}, (c.prices && c.prices[i]) || {});
      var st = card.querySelectorAll('.price-pair strong');
      if (st.length !== 2) return;
      [p.solo, p.duo].forEach(function (v, k) {
        st[k].innerHTML = '<s style="font-size:.62em;font-weight:500;color:#8a8a8a;margin-right:6px">' + fmt(v) + '</s> ' + fmt(Math.round(v * (1 - pct / 100))) + ' <i>DH</i>';
      });
    });
  }).catch(function () {});
})();
