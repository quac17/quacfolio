// Language, theme, menu and the parts of each page built from data.js.
(function () {
  const SITE = window.SITE;
  const P = SITE.profile;
  const LANGS = ['vi', 'en', 'ja'];
  const LOCALES = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP' };
  const root = document.documentElement;
  root.classList.add('js');

  // Storage can throw (private windows, blocked site data): the site works
  // without it, it just forgets the choice.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  function initialLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const saved = store.get('lang');
    return LANGS.includes(saved) ? saved : 'vi';
  }

  let lang = initialLang();

  const fill = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  const t = (key, vars) => fill(SITE.strings[lang][key] ?? SITE.strings.vi[key] ?? key, { name: P.name, ...vars });
  const L = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.vi : v);

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid);
    return n;
  }

  const monthYear = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    const s = new Intl.DateTimeFormat(LOCALES[lang], { year: 'numeric', month: 'long' }).format(new Date(y, m - 1, 1));
    return s.charAt(0).toUpperCase() + s.slice(1); // vi gives "tháng 10 năm 2026"
  };

  const external = (href, label, cls) =>
    el('a', { href, class: cls, target: '_blank', rel: 'noopener' }, label, el('span', { class: 'sr-only' }, ' ' + t('ui.newTab')));

  // ---- static text -------------------------------------------------------

  function applyStrings() {
    root.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach((n) => {
      for (const pair of n.dataset.i18nAttr.split(';')) {
        const [attr, key] = pair.split(':');
        n.setAttribute(attr, t(key));
      }
    });
    document.querySelectorAll('[data-profile]').forEach((n) => {
      const v = L(P[n.dataset.profile]);
      if (typeof v === 'string') n.textContent = v;
    });
    document.querySelectorAll('[data-mail]').forEach((n) => { n.href = 'mailto:' + P.email; });
    document.querySelectorAll('[data-github]').forEach((n) => { n.href = P.github; });
    document.querySelectorAll('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const titleKey = document.body.dataset.title;
    if (titleKey) document.title = t(titleKey);
  }

  // ---- page parts --------------------------------------------------------

  const tags = (stack, cls = 'tags') => el('ul', { class: cls }, stack.map((s) => el('li', {}, s)));

  const renderers = {
    // Home: the list under the hero, laid out like a list of posts.
    'project-list'(box) {
      box.replaceChildren(...SITE.projects.map((p) =>
        el('li', { class: 'row' },
          el('article', {},
            el('dl', {}, el('dt', { class: 'sr-only' }, t('home.built')),
              el('dd', { class: 'row-date' }, el('time', { datetime: p.date }, monthYear(p.date)))),
            el('div', { class: 'row-body' },
              el('h3', { class: 'row-title' }, external(p.url, p.name)),
              tags(p.stack),
              el('p', { class: 'row-text' }, L(p.summary)),
              external(p.url, t('home.open'), 'more'))))));
    },

    // Projects page: cards with a 16:9 screenshot.
    'project-cards'(box) {
      box.replaceChildren(...SITE.projects.map((p) =>
        el('li', { class: 'card' },
          el('a', { href: p.url, target: '_blank', rel: 'noopener', class: 'card-img', tabindex: '-1', 'aria-hidden': 'true' },
            el('img', { src: p.image, alt: '', loading: 'lazy', width: '1280', height: '800' })),
          el('div', { class: 'card-body' },
            el('h2', { class: 'card-title' }, external(p.url, p.name)),
            el('p', { class: 'card-text' }, L(p.summary)),
            tags(p.stack),
            external(p.url, t('home.open'), 'more')))));
    },

    bio(box) {
      box.replaceChildren(...L(P.bio).map((para) => el('p', {}, para)));
    },

    working(box) {
      box.replaceChildren(...P.working.map((w) => el('li', {}, w)));
    },

    // Portfolio: one row per project, the screenshot on alternating sides.
    featured(box) {
      box.replaceChildren(...SITE.projects.map((p) =>
        el('article', { class: 'proj', 'data-reveal': true },
          el('div', { class: 'proj-text' },
            el('h3', { class: 'proj-title' }, external(p.url, p.name)),
            el('p', { class: 'proj-meta' }, monthYear(p.date) + ' · ' + t('pf.personal')),
            el('p', {}, L(p.summary)),
            el('ul', { class: 'proj-points' }, L(p.points).map((x) => el('li', {}, x))),
            tags(p.stack, 'chips'),
            el('a', { href: p.url, target: '_blank', rel: 'noopener', class: 'btn' },
              el('span', { class: 'icon', html: ICONS.link, 'aria-hidden': 'true' }), L(p.action),
              el('span', { class: 'sr-only' }, ' — ' + p.name + ' ' + t('ui.newTab')))),
          el('a', { href: p.url, target: '_blank', rel: 'noopener', class: 'proj-shot', style: '--shot:' + p.color, tabindex: '-1', 'aria-hidden': 'true' },
            el('img', { src: p.image, alt: t('pf.shot', { project: p.name }), loading: 'lazy', width: '1280', height: '800' })))));
      reveal(box);
    },

    skills(box) {
      box.replaceChildren(...P.skills.map((g) =>
        el('div', { class: 'skill-group' }, el('h4', {}, L(g.name)), tags(g.items, 'chips'))));
    },

    education(box) {
      box.replaceChildren(el('ul', { class: 'edu-list' }, (P.education || []).map((item) =>
        el('li', {},
          el('p', { class: 'edu-school' }, L(item.school)),
          el('p', { class: 'edu-meta' }, item.start + ' – ' + item.end + ' · ' + L(item.major))))));
    },
  };

  const ICONS = {
    link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  };

  function render() {
    applyStrings();
    document.querySelectorAll('[data-render]').forEach((box) => {
      const draw = renderers[box.dataset.render];
      if (!draw) return;
      try { draw(box); } catch (error) { console.error(box.dataset.render, error); }
    });
  }

  // ---- scroll reveal (portfolio) -----------------------------------------

  let observer;
  function inView(n) {
    const r = n.getBoundingClientRect();
    const h = window.innerHeight || document.documentElement.clientHeight;
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < h;
  }
  function reveal(scope) {
    const items = [...scope.querySelectorAll('[data-reveal]')].filter((n) => !n.classList.contains('in'));
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((n) => n.classList.add('in'));
      return;
    }
    // Hash links scroll after this script. Anything already on screen must
    // show immediately; waiting for the observer leaves it invisible.
    items.forEach((n) => { if (inView(n)) n.classList.add('in'); });
    const rest = items.filter((n) => !n.classList.contains('in'));
    if (!rest.length) return;
    observer ??= new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
    }, { rootMargin: '0px' });
    rest.forEach((n) => observer.observe(n));
  }

  // ---- controls ----------------------------------------------------------

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    store.set('lang', lang);
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) { url.searchParams.delete('lang'); history.replaceState(null, '', url); }
    render();
  }

  function currentTheme() {
    return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  document.addEventListener('click', (e) => {
    const langBtn = e.target.closest('[data-lang]');
    if (langBtn) return setLang(langBtn.dataset.lang);

    if (e.target.closest('[data-theme-toggle]')) {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      store.set('theme', next);
      return;
    }

    const menuBtn = e.target.closest('[data-menu-toggle]');
    const header = document.querySelector('.site-header');
    if (menuBtn) {
      const open = header.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      return;
    }
    // A link in the open menu closes it (in-page anchors on the portfolio).
    if (header?.classList.contains('menu-open') && e.target.closest('.nav a')) {
      header.classList.remove('menu-open');
      document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    const header = document.querySelector('.site-header.menu-open');
    if (e.key === 'Escape' && header) {
      header.classList.remove('menu-open');
      const btn = header.querySelector('[data-menu-toggle]');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });

  try {
    render();
    reveal(document);
  } finally {
    root.classList.remove('i18n-pending');
  }
  requestAnimationFrame(() => reveal(document));
  addEventListener('load', () => reveal(document));
  addEventListener('hashchange', () => requestAnimationFrame(() => reveal(document)));
})();
