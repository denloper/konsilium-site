/* Консилиум — лендинг. Чистый JS, без зависимостей. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hdr = document.getElementById('hdr');

  /* 1. Появление блоков при прокрутке (fade + slide + blur, со ступенчатой задержкой) */
  var items = document.querySelectorAll('.rv, .tl');
  document.querySelectorAll('.g3,.g3e,.g4,.bento,.cost-row,.tiers,.tl,.cl,.tags,.sol,.g2,.steps').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--d', (i * 0.08) + 's'); });
  });
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    /* страховка: если IO не сработал (быстрая прокрутка/якорь) — проявляем всё, что уже выше низа экрана */
    var sweep = function () {
      var vh = window.innerHeight;
      items.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.95) el.classList.add('in'); });
    };
    window.addEventListener('scroll', function () { clearTimeout(sweep.t); sweep.t = setTimeout(sweep, 120); }, { passive: true });
  }
  /* hero появляется сразу */
  requestAnimationFrame(function () {
    document.querySelectorAll('.hero .rv').forEach(function (el, i) { el.style.setProperty('--d', (0.1 + i * 0.1) + 's'); el.classList.add('in'); });
  });

  /* 2. Шапка: стекло при прокрутке, светлая тема над светлыми секциями, подсветка пункта меню */
  var secs = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var links = document.querySelectorAll('.nav a[href^="#"]');
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('scrolled', y > 20);
    var probe = y + 40, cur = null;
    secs.forEach(function (s) { if (s.offsetTop <= probe && s.offsetTop + s.offsetHeight > probe) cur = s; });
    hdr.classList.toggle('light', !!cur && !cur.classList.contains('dark') && y > 20);
    var act = null;
    secs.forEach(function (s) { if (s.offsetTop <= y + window.innerHeight * 0.4) act = s.id; });
    links.forEach(function (a) { a.classList.toggle('act', a.getAttribute('href') === '#' + act); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* 3. Мобильное меню */
  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  /* 4. Лёгкий параллакс в hero (мышь + прокрутка) */
  var vis = document.querySelector('[data-parallax]');
  if (vis && !reduce && window.matchMedia('(min-width: 981px)').matches) {
    var mx = 0, my = 0, ticking = false;
    function apply() {
      var sy = Math.min(window.scrollY, 900);
      vis.style.transform = 'translate3d(' + (mx * 14) + 'px,' + (my * 14 + sy * -0.12) + 'px,0) rotateY(' + (mx * 4) + 'deg) rotateX(' + (-my * 4) + 'deg)';
      ticking = false;
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
    if (window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; req(); }, { passive: true });
    }
    window.addEventListener('scroll', req, { passive: true });
    vis.style.transition = 'transform .25s ease-out'; vis.style.perspective = '1000px';
  }

  /* 5. Форма заявки
     ============================================================
     TODO для программиста: подключите отправку.
     Укажите адрес обработчика в FORM_ENDPOINT (ваш backend, CRM-вебхук,
     Telegram-бот, amoCRM/Bitrix24 и т.п.). Пока FORM_ENDPOINT пустой —
     форма НИЧЕГО не отправляет, только показывает сообщение.
     ============================================================ */
  var FORM_ENDPOINT = ''; // например: 'https://example.com/api/lead'
  var form = document.getElementById('lead-form');
  var msg = form.querySelector('.fmsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'phone'].forEach(function (n) {
      var f = form.elements[n]; var bad = !f.value.trim() || (n === 'phone' && f.value.replace(/\D/g, '').length < 10);
      f.classList.toggle('invalid', bad); if (bad) ok = false;
    });
    if (!form.elements.agree.checked) { ok = false; }
    if (!ok) { msg.textContent = 'Пожалуйста, укажите имя, телефон и подтвердите согласие.'; return; }
    var data = { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), comment: form.elements.comment.value.trim() };
    if (!FORM_ENDPOINT) {
      console.info('[Консилиум] Форма не подключена. Данные заявки:', data);
      msg.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      form.reset(); return;
    }
    fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw 0; msg.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.'; form.reset(); })
      .catch(function () { msg.textContent = 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.'; });
  });

  var y = document.getElementById('y'); if (y) y.textContent = new Date().getFullYear();
})();
