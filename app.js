const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const header = document.querySelector('.site-header');

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
});

document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

const closeMenu = () => { mainNav?.classList.remove('open'); menuToggle?.setAttribute('aria-expanded', 'false'); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
document.addEventListener('click', (e) => { if (mainNav?.classList.contains('open') && !e.target.closest('.site-header')) closeMenu(); });

const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

const revealTargets = document.querySelectorAll('.section-light > .shell, .section-dark > .shell, .section-sand > .shell, .route-card, .price-card, .included-panel, .reservation-form, .contact-grid');
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.1 });
revealTargets.forEach((element) => { element.classList.add('reveal'); revealObserver.observe(element); });

const bookingSelect = document.querySelector('#booking-plan');
document.querySelectorAll('[data-plan]').forEach((link) => link.addEventListener('click', () => {
  if (bookingSelect) bookingSelect.value = link.dataset.plan;
}));

const reservationForm = document.querySelector('#reservation-form');
const statusMessage = document.querySelector('#form-status');
const submitButton = reservationForm?.querySelector('button[type="submit"]');
let whatsappNumber = '212623873731';
let siteContent = {};
let hoursOpen = '09:00', hoursClose = '19:00';
const dateInput = document.querySelector('#booking-date');
if (dateInput) {
  const today = new Date();
  dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function setStatus(message, error = false) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', error);
}
function formatDate(value) {
  return new Intl.DateTimeFormat(({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[document.documentElement.lang] || 'fr-FR'), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
reservationForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!reservationForm.checkValidity()) { reservationForm.reportValidity(); return; }
  const formData = new FormData(reservationForm);
  const data = {
    name: String(formData.get('guestName')).trim(),
    adults: Number(formData.get('adults')),
    children: Number(formData.get('children') || 0),
    date: String(formData.get('date')),
    time: String(formData.get('time')),
    plan: bookingSelect?.selectedOptions?.[0]?.textContent?.trim() || String(formData.get('plan'))
  };
  if (data.date < dateInput.min) { setStatus(window.bookingStrings?.dateError || 'Merci de choisir une date à partir d\'aujourd\'hui.', true); return; }
  setStatus('');
  if (data.time < hoursOpen || data.time > hoursClose) {
    setStatus(window.bookingStrings?.timeError || `Merci de choisir une heure entre ${hoursOpen} et ${hoursClose}.`, true);
    return;
  }
  submitButton.disabled = true;
  const labels = window.bookingStrings || { greeting: 'Bonjour Kaouki Quad, je souhaite réserver :', people: 'Personnes', adults: 'adulte(s)', children: 'enfant(s)', date: 'Date', plan: 'Formule' };
  const message = `${labels.greeting}\nNom : ${data.name}\n${labels.people} : ${data.adults} ${labels.adults}, ${data.children} ${labels.children}\n${labels.date} : ${formatDate(data.date)} à ${data.time}\n${labels.plan} : ${data.plan}`;
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  setStatus(window.bookingStrings?.sent || 'WhatsApp est ouvert avec votre demande.');
  submitButton.disabled = false;
});

const defaultPrices = [{ solo: 300, duo: 450 }, { solo: 550, duo: 750 }, { solo: 800, duo: 1000 }, { solo: 1300, duo: 1550 }];
const getPrices = () => defaultPrices.map((p, i) => ({ ...p, ...(siteContent.prices?.[i] || {}) }));
const fmtPrice = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
function mergeDeep(base, extra) {
  if (extra === undefined || extra === null) return base;
  if (Array.isArray(base) || typeof base !== 'object' || typeof extra !== 'object') return extra;
  const out = { ...base };
  Object.keys(extra).forEach((k) => { out[k] = mergeDeep(base[k], extra[k]); });
  return out;
}
const imageSlots = {
  hero: ['.hero-photo', 'bg', 'hero.jpg'], banner: ['.booking-banner-image', 'bg', 'gallery-6.jpg'],
  tour1: ['.route-card:nth-child(1) .route-image img', 'img'], tour2: ['.route-card:nth-child(2) .route-image img', 'img'], tour3: ['.route-card:nth-child(3) .route-image img', 'img'], tour4: ['.route-card:nth-child(4) .route-image img', 'img'],
  g1: ['.photo-strip-images figure:nth-child(1) img', 'img'], g2: ['.photo-strip-images figure:nth-child(2) img', 'img'], g3: ['.photo-strip-images figure:nth-child(3) img', 'img'], g4: ['.photo-strip-images figure:nth-child(4) img', 'img'], g5: ['.photo-strip-images figure:nth-child(5) img', 'img'], g6: ['.photo-strip-images figure:nth-child(6) img', 'img'],
  logo: ['.brand img, .footer-brand img', 'img']
};
function applyContent(c) {
  const q = (sel) => document.querySelectorAll(sel);
  const prices = getPrices();
  prices.forEach((p, i) => {
    const card = q('.price-card')[i];
    const strongs = card?.querySelectorAll('.price-pair strong');
    if (strongs?.length === 2) { strongs[0].innerHTML = fmtPrice(p.solo) + ' <i>DH</i>'; strongs[1].innerHTML = fmtPrice(p.duo) + ' <i>DH</i>'; }
  });
  (c.tours || []).forEach((tour, i) => {
    if (tour?.visible === false) {
      [q('.price-card')[i], q('.route-card')[i], bookingSelect?.options[i + 1]].forEach((el) => { if (el) el.hidden = true; });
    }
  });
  const ct = c.contact || {};
  if (ct.whatsapp) { whatsappNumber = ct.whatsapp.replace(/\D/g, ''); q('a[href^="https://wa.me/"]').forEach((a) => { a.href = 'https://wa.me/' + whatsappNumber; }); }
  if (ct.phone) { q('a[href^="tel:"]').forEach((a) => { a.href = 'tel:' + ct.phone.replace(/\s/g, ''); a.textContent = ct.phone; }); }
  if (ct.mapUrl) q('a[href*="maps.app.goo.gl"]').forEach((a) => { a.href = ct.mapUrl; });
  if (ct.instagram) q('a[href*="instagram.com"]').forEach((a) => { a.href = ct.instagram; });
  if (ct.open) hoursOpen = ct.open;
  if (ct.close) hoursClose = ct.close;
  const timeInput = document.querySelector('#booking-time');
  if (timeInput) { timeInput.min = hoursOpen; timeInput.max = hoursClose; }
  document.querySelectorAll('.contact-item p').forEach((p) => { if (/\d{2}:\d{2}/.test(p.textContent)) p.textContent = hoursOpen + ' — ' + hoursClose; });
  const fw = document.querySelector('.floating-whatsapp');
  if (fw && c.settings?.floatingWhatsapp === false) fw.hidden = true;
  if (c.theme?.gold) document.documentElement.style.setProperty('--gold', c.theme.gold);
  if (c.theme?.forest) document.documentElement.style.setProperty('--forest', c.theme.forest);
  Object.entries(c.images || {}).forEach(([slot, url]) => {
    const def = imageSlots[slot]; if (!def || !url) return;
    q(def[0]).forEach((el) => { if (def[1] === 'bg') el.style.backgroundImage = `url('${url}')`; else el.src = url; });
  });
  if (c.images?.logo) { const fav = document.querySelector('link[rel=icon]'); if (fav) fav.href = c.images.logo; }
}

const translationMap = [
  ['.main-nav a:nth-child(1)','navHome'],['.main-nav a:nth-child(2)','navTours'],['.main-nav a:nth-child(3)','navRoutes'],['.main-nav a:nth-child(4)','navFaq'],['.main-nav a:nth-child(5)','navContact'],['.header-book','book'],
  ['.hero h1','heroTitle'],['.hero-tagline','heroTagline'],['.hero-subtitle','heroSubtitle'],['.hero-actions .button-gold','heroPrimary'],['.hero-actions .button-ghost','heroSecondary'],['.hero-meta>span:last-child','heroMeta'],['.hero-scroll span','heroScroll'],
  ['.intro-copy .eyebrow','introEyebrow'],['.intro-copy h2','introTitle'],['.intro-text p:first-child','introText'],['.fine-print','introFine'],['.pricing .eyebrow','pricingEyebrow'],['.pricing h2','pricingTitle'],['.pricing .heading-note','pricingNote'],
  ['.price-card:nth-child(1) .price-top span','p1Time'],['.price-card:nth-child(1) h3','p1Title'],['.price-card:nth-child(1)>p','p1Desc'],['.price-card:nth-child(2) .price-top span','p2Time'],['.price-card:nth-child(2) h3','p2Title'],['.price-card:nth-child(2)>p','p2Desc'],['.price-card:nth-child(3) .price-top span','p3Time'],['.price-card:nth-child(3) h3','p3Title'],['.price-card:nth-child(3)>p','p3Desc'],['.price-card:nth-child(4) .price-top span','p4Time'],['.price-card:nth-child(4) h3','p4Title'],['.price-card:nth-child(4) p','p4Desc'],
  ['.price-card:nth-child(1) .price-pair div:nth-child(1) small','solo'],['.price-card:nth-child(2) .price-pair div:nth-child(1) small','solo'],['.price-card:nth-child(3) .price-pair div:nth-child(1) small','solo'],['.price-card:nth-child(4) .price-pair div:nth-child(1) small','solo'],['.price-card:nth-child(1) .price-pair div:nth-child(2) small','duo'],['.price-card:nth-child(2) .price-pair div:nth-child(2) small','duo'],['.price-card:nth-child(3) .price-pair div:nth-child(2) small','duo'],['.price-card:nth-child(4) .price-pair div:nth-child(2) small','duo'],['.ribbon','most'],['.price-note p','priceNote'],
  ['.routes .eyebrow','routesEyebrow'],['.routes h2','routesTitle'],['.routes .heading-note','routesNote'],['.route-card:nth-child(1) .eyebrow','r1Eyebrow'],['.route-card:nth-child(1) h3','r1Title'],['.route-card:nth-child(1) .route-body>p','r1Text'],['.route-card:nth-child(2) .eyebrow','r2Eyebrow'],['.route-card:nth-child(2) h3','r2Title'],['.route-card:nth-child(2) .route-body>p','r2Text'],['.route-card:nth-child(3) .eyebrow','r3Eyebrow'],['.route-card:nth-child(3) h3','r3Title'],['.route-card:nth-child(3) .route-body>p','r3Text'],['.route-card:nth-child(4) .eyebrow','r4Eyebrow'],['.route-card:nth-child(4) h3','r4Title'],['.route-card:nth-child(4) .route-body>p','r4Text'],
  ['.photo-strip-copy .eyebrow','photoEyebrow'],['.photo-strip-copy h2','photoTitle'],['.photo-strip-copy>p:last-child','photoText'],['.photo-strip-images figure:nth-child(1) figcaption','photo1'],['.photo-strip-images figure:nth-child(2) figcaption','photo2'],['.photo-strip-images figure:nth-child(3) figcaption','photo3'],['.photo-strip-images figure:nth-child(4) figcaption','photo4'],['.photo-strip-images figure:nth-child(5) figcaption','photo5'],['.photo-strip-images figure:nth-child(6) figcaption','photo6'],
  ['.included .eyebrow','includedEyebrow'],['.included h2','includedTitle'],['.included .section-lead','includedLead'],['.included-col:nth-child(1) .panel-label','includedLabel'],['.included-col:nth-child(2) .panel-label','includedNeed'],
  ['.faq-grid .eyebrow','faqEyebrow'],['.faq-grid h2','faqTitle'],['.faq-grid .section-lead','faqLead'],['.faq-grid .button','faqButton'],['.booking-banner .eyebrow','bannerEyebrow'],['.booking-banner h2','bannerTitle'],['.booking-banner .button','bannerButton'],
  ['.reservation-copy .eyebrow','reservationEyebrow'],['.reservation-copy h2','reservationTitle'],['.reservation-copy>p:not(.eyebrow)','reservationLead'],['.reservation-note b','reservationNote'],['.reservation-note small','reservationNoteSmall'],['.form-title span','formTitle'],['label[for="none"]','formTitle'],['.reservation-form label:nth-of-type(1) span','nameLabel'],['.form-row:nth-of-type(1) label:nth-child(1) span','adultsLabel'],['.form-row:nth-of-type(1) label:nth-child(2) span','childrenLabel'],['.form-row:nth-of-type(2) label:nth-child(1) span','dateLabel'],['.form-row:nth-of-type(2) label:nth-child(2) span','timeLabel'],['.reservation-form>label:last-of-type span','planLabel'],['#guest-name','namePlaceholder'],['.form-submit','formButton'],['.form-help','formHelp'],
  ['.contact-grid .eyebrow','contactEyebrow'],['.contact-grid h2','contactTitle'],['.contact-item:nth-child(2) small','whatsappLabel'],['.contact-item:nth-child(3) small','locationLabel'],['.contact-item:nth-child(4) small','hoursLabel'],['.contact-item:nth-child(4) p','hours'],['.footer-grid>div:nth-child(2) h3','footerExplore'],['.footer-grid>div:nth-child(3) h3','footerBrand'],['.footer-mark span','footerPlace'],['.footer-bottom span:nth-child(1)','footerCopyright'],['.footer-bottom span:nth-child(2)','footerLocation']
];

function applyLanguage(lang) {
  const t = mergeDeep(siteTranslations[lang] || siteTranslations.fr, siteContent.texts?.[lang]);
  document.documentElement.lang = lang;
  document.documentElement.dir = 'ltr';
  document.title = lang === 'en' ? 'Kaouki Quad — Tours & prices' : lang === 'es' ? 'Kaouki Quad — Rutas y precios' : 'Kaouki Quad — Tours & tarifs';
  translationMap.forEach(([selector, key]) => document.querySelectorAll(selector).forEach((node) => { node.innerHTML = t[key] ?? ''; }));
  document.querySelectorAll('.price-card .card-link').forEach((node) => { node.innerHTML = t.priceLink; });
  const sectionLabel = { fr: 'À savoir', en: 'Good to know', es: 'A saber' }[lang];
  const introLabel = document.querySelector('.intro .section-index small');
  if (introLabel) introLabel.textContent = sectionLabel;
  document.querySelectorAll('.route-card .text-link').forEach((node) => { node.innerHTML = t.routeLink; });
  document.querySelectorAll('.included-col:nth-child(1) li').forEach((node, i) => { node.textContent = t.includedItems[i] || ''; });
  document.querySelectorAll('.included-col:nth-child(2) li').forEach((node, i) => { node.textContent = t.needItems[i] || ''; });
  document.querySelectorAll('.route-card').forEach((card, i) => card.querySelectorAll('li').forEach((node, j) => { node.textContent = t.routeItems[i]?.[j] || ''; }));
  document.querySelectorAll('.faq-list details').forEach((detail, i) => { const item = t.faqItems[i]; if (!item) return; detail.querySelector('summary').innerHTML = `${item[0]}<span>+</span>`; detail.querySelector('p').textContent = item[1]; });
  const prices = getPrices();
  const plans = [1, 2, 3, 4].map((n) => t['p' + n + 'Title'] + ' — ' + t['p' + n + 'Time'] + ' — ' + prices[n - 1].solo + ' DH');
  const select = document.querySelector('#booking-plan');
  if (select) { Array.from(select.options).forEach((option, i) => { option.textContent = i === 0 ? t.choose : plans[i - 1]; }); }
  const formLabels = [['#guest-name','nameLabel'],['#adult-count','adultsLabel'],['#child-count','childrenLabel'],['#booking-date','dateLabel'],['#booking-time','timeLabel'],['#booking-plan','planLabel']];
  formLabels.forEach(([selector, key]) => { const field = document.querySelector(selector); const label = field?.closest('label'); const text = label?.querySelector('span'); if (text) text.innerHTML = t[key]; });
  if (document.querySelector('#guest-name')) document.querySelector('#guest-name').placeholder = t.namePlaceholder;
  const durations = { fr:['01 heure','02 heures','02 à 03 heures','Journée entière'], en:['01 hour','02 hours','02 to 03 hours','Full day'], es:['01 hora','02 horas','02 a 03 horas','Día completo'] }[lang];
  document.querySelectorAll('.route-image span').forEach((node, i) => { node.textContent = durations[i]; });
  const footerLinks = { fr:['Tours & tarifs','Les circuits','FAQ'], en:['Tours & prices','The routes','FAQ'], es:['Rutas y precios','Los circuitos','FAQ'] }[lang];
  document.querySelectorAll('.footer-grid>div:nth-child(2) a').forEach((node, i) => { node.textContent = footerLinks[i] || node.textContent; });
  const brandLinks = { fr:['Réserver','Contact','Instagram ↗'], en:['Book','Contact','Instagram ↗'], es:['Reservar','Contacto','Instagram ↗'] }[lang];
  document.querySelectorAll('.footer-grid>div:nth-child(3) a').forEach((node, i) => { node.textContent = brandLinks[i] || node.textContent; });
  document.querySelectorAll('[data-lang]').forEach((button) => button.classList.toggle('active', button.dataset.lang === lang));
  try { localStorage.setItem('kaouki-language', lang); } catch (e) {}
  window.currentSiteLanguage = lang;
  window.bookingStrings = t.booking;
}

document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));
let savedLang = 'fr';
try { savedLang = localStorage.getItem('kaouki-language') || 'fr'; } catch (e) {}
applyLanguage(savedLang);
fetch('content.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((c) => {
  if (!c || !Object.keys(c).length) return;
  siteContent = c;
  applyLanguage(window.currentSiteLanguage || savedLang);
  applyContent(c);
}).catch(() => {});
