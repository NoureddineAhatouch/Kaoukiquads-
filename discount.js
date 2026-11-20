(function () {
  var DEBUG = /[?&]debug/.test(location.search);
  function say(msg, ok) {
    if (!DEBUG) return;
    var d = document.getElementById('disc-debug') || document.body.appendChild(document.createElement('div'));
    d.id = 'disc-debug';
    d.style.cssText = 'position:fixed;z-index:99999;left:8px;right:8px;bottom:8px;padding:10px 12px;border-radius:8px;font:13px/1.5 monospace;color:#fff;background:' + (ok ? '#2f7a4f' : '#b3402f') + ';direction:ltr;word-break:break-all';
    d.textContent = 'discount.js: ' + msg;
  }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  var defaults = [{ solo: 300, duo: 450 }, { solo: 550, duo: 750 }, { solo: 800, duo: 1000 }, { solo: 1300, duo: 1550 }];
  say('loaded, fetching content.json…', true);
  fetch('content.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
    if (!r.ok) { say('content.json HTTP ' + r.status, false); return null; }
    return r.text().then(function (t) { try { return JSON.parse(t); } catch (e) { say('content.json is INVALID JSON: ' + e.message, false); return null; } });
  }).then(function (c) {
    if (!c) return;
    var s = c.settings || {}, pct = Number(s.discountPercent);
    var on = s.discountEnabled === true && pct > 0 && pct < 100;
    var badge = document.getElementById('discount-badge');
    if (!on) { if (badge) badge.remove(); say('OFF — discountEnabled=' + JSON.stringify(s.discountEnabled) + ' discountPercent=' + JSON.stringify(s.discountPercent), false); return; }
    if (!badge) { badge = document.createElement('div'); badge.id = 'discount-badge'; document.body.appendChild(badge); }
    badge.textContent = '-' + pct + '%';
    var big = window.innerWidth >= 900;
    badge.style.cssText = 'position:fixed;z-index:9999;top:' + (big ? 104 : 90) + 'px;left:' + (big ? 24 : 14) + 'px;display:grid;place-items:center;width:' + (big ? 84 : 68) + 'px;height:' + (big ? 84 : 68) + 'px;border-radius:50%;background:#c9f0d3;border:2px solid #8fd6a5;color:#0b5d2a;font:800 ' + (big ? 30 : 24) + 'px/1 "Barlow Condensed",Arial,sans-serif;box-shadow:0 8px 22px rgba(11,93,42,.28);pointer-events:none';
    var cards = document.querySelectorAll('.price-card');
    cards.forEach(function (card, i) {
      var p = Object.assign({}, defaults[i] || {}, (c.prices && c.prices[i]) || {});
      var st = card.querySelectorAll('.price-pair strong');
      if (st.length !== 2) return;
      [p.solo, p.duo].forEach(function (v, k) {
        st[k].innerHTML = '<s style="font-size:.62em;font-weight:500;color:#8a8a8a;margin-right:6px">' + fmt(v) + '</s> ' + fmt(Math.round(v * (1 - pct / 100))) + ' <i>DH</i>';
      });
    });
    say('ON — -' + pct + '% applied, price cards found: ' + cards.length, true);
  }).catch(function (e) { say('error: ' + e.message, false); });
})();
