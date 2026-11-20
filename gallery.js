/* Images supplémentaires (ajoutées depuis l'admin) :
   - circuits (tour1..4) : diaporama à faire glisser
   - hero / bannière : fondu enchaîné automatique
   - galerie : nouvelles photos à la suite des six existantes
   Lit content.json lui-même (indépendant de app.js). */
(function () {
  var css = [
    '.route-image .rx-track{position:absolute;inset:0;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}',
    '.route-image .rx-track::-webkit-scrollbar{display:none}',
    '.route-image .rx-slide{flex:0 0 100%;height:100%;scroll-snap-align:start;background-size:cover;background-position:center}',
    '.route-image .rx-slide img{width:100%;height:100%;object-fit:cover}',
    '.route-image:after{pointer-events:none}',
    '.rx-dots{position:absolute;z-index:2;right:16px;bottom:20px;display:flex;gap:6px;pointer-events:none}',
    '.rx-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5)}',
    '.rx-dots i.on{background:#fff}',
    '.rx-arrow{position:absolute;z-index:2;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.85);color:#26372f;font-size:18px;line-height:1;cursor:pointer}',
    '.rx-prev{left:10px}.rx-next{right:10px}',
    '.rx-layer{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1s ease}',
    '.rx-layer.on{opacity:1}'
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function carousel(n, extras) {
    var box = document.querySelector('.route-card:nth-child(' + n + ') .route-image');
    var img = box && box.querySelector('img');
    if (!box || !img || !extras.length) return;
    var track = document.createElement('div'); track.className = 'rx-track';
    var first = document.createElement('div'); first.className = 'rx-slide'; first.appendChild(img); track.appendChild(first);
    extras.forEach(function (it) { var s = document.createElement('div'); s.className = 'rx-slide'; s.style.backgroundImage = 'url("' + it.src + '")'; track.appendChild(s); });
    box.insertBefore(track, box.firstChild);
    var dots = document.createElement('div'); dots.className = 'rx-dots';
    for (var i = 0; i <= extras.length; i++) dots.appendChild(document.createElement('i'));
    box.appendChild(dots);
    function mark() { var k = Math.round(track.scrollLeft / track.clientWidth); Array.prototype.forEach.call(dots.children, function (d, j) { d.className = j === k ? 'on' : ''; }); }
    track.addEventListener('scroll', mark, { passive: true }); mark();
    [['rx-prev', '‹', -1], ['rx-next', '›', 1]].forEach(function (a) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rx-arrow ' + a[0]; b.textContent = a[1]; b.setAttribute('aria-label', a[2] < 0 ? 'Précédent' : 'Suivant');
      b.onclick = function () { track.scrollBy({ left: a[2] * track.clientWidth, behavior: 'smooth' }); };
      box.appendChild(b);
    });
  }

  function fader(sel, extras) {
    var host = document.querySelector(sel);
    if (!host || !extras.length) return;
    var layers = extras.map(function (it) { var l = document.createElement('div'); l.className = 'rx-layer'; l.style.backgroundImage = 'url("' + it.src + '")'; host.appendChild(l); return l; });
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var idx = 0, n = layers.length + 1;
    setInterval(function () {
      idx = (idx + 1) % n;
      layers.forEach(function (l, j) { l.classList.toggle('on', j === idx - 1); });
    }, 6000);
  }

  fetch('content.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
    if (!c || !c.extraImages) return;
    var ex = c.extraImages;
    [1, 2, 3, 4].forEach(function (n) { carousel(n, ex['tour' + n] || []); });
    fader('.hero-photo', ex.hero || []);
    fader('.booking-banner-image', ex.banner || []);
    var strip = document.querySelector('.photo-strip-images');
    if (strip) (ex.gallery || []).forEach(function (it) {
      var f = document.createElement('figure'), im = new Image();
      im.loading = 'lazy'; im.src = it.src; im.alt = it.caption || ''; f.appendChild(im);
      if (it.caption) { var fc = document.createElement('figcaption'); fc.textContent = it.caption; f.appendChild(fc); }
      strip.appendChild(f);
    });
  }).catch(function () {});
})();
