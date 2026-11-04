// Reads assets/js/data.js and writes those values into the static HTML.
// Run from the repo root: yarn export
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadSiteFrom(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: file });
  if (!sandbox.window.SITE) throw new Error(path.basename(file) + ' phải gán window.SITE');
  return sandbox.window.SITE;
}

function loadSite() {
  return loadSiteFrom(path.join(root, 'assets/js/data.js'));
}

function readText(file) {
  const text = fs.readFileSync(file, 'utf8');
  return { text: text.replace(/\r\n/g, '\n'), nl: text.includes('\r\n') ? '\r\n' : '\n' };
}

function writeText(file, text, nl) {
  fs.writeFileSync(file, nl === '\r\n' ? text.replace(/\n/g, '\r\n') : text);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const L = (v, lang = 'vi') => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.vi ?? '') : (v ?? ''));
const apply = (text, site) => String(text).replaceAll('{name}', site.profile.name);

function resolve(key, site) {
  if (key.startsWith('meta.')) return site.meta[key.slice(5)];
  if (key === 'cv.title') return site.cv.ui.vi.title;
  if (key === 'cv.description') return site.cv.description;
  if (site.strings.vi[key] != null) return apply(site.strings.vi[key], site);
  throw new Error('Không có khóa điền ' + key);
}

function fillRegion(html, name, content) {
  const re = new RegExp(`<!-- fill:${name} -->[\\s\\S]*?<!-- /fill:${name} -->`);
  if (!re.test(html)) throw new Error('Thiếu vùng <!-- fill:' + name + ' -->');
  return html.replace(re, `<!-- fill:${name} -->\n${content}\n<!-- /fill:${name} -->`);
}

function fillJsRegion(html, name, content) {
  const re = new RegExp(`/\\* fill:${name} \\*/[\\s\\S]*?/\\* /fill:${name} \\*/`);
  if (!re.test(html)) throw new Error('Thiếu vùng /* fill:' + name + ' */');
  return html.replace(re, `/* fill:${name} */\n${content}\n/* /fill:${name} */`);
}

function fillPage(html, site) {
  html = html.replace(
    /(<([a-zA-Z0-9]+)\b[^>]*\bdata-i18n-html="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (m, open, tag, key, inner, close) => open + apply(site.strings.vi[key], site) + close,
  );
  html = html.replace(
    /(<[^>]*\bdata-i18n="([^"]+)"[^>]*>)[^<]*/g,
    (m, open, key) => open + esc(apply(site.strings.vi[key], site)),
  );
  html = html.replace(/<[^>]*\bdata-i18n-attr="([^"]+)"[^>]*>/g, (tag, spec) => {
    for (const pair of spec.split(';')) {
      const [name, key] = pair.split(':');
      const value = attr(apply(site.strings.vi[key], site));
      tag = tag.replace(new RegExp(name + '="[^"]*"'), name + '="' + value + '"');
    }
    return tag;
  });

  const profileText = {
    name: site.profile.name,
    email: site.profile.email,
    role: L(site.profile.role),
    tagline: L(site.profile.tagline),
    taglineNote: L(site.profile.taglineNote),
    quote: L(site.profile.quote),
  };
  html = html.replace(
    /(<[^>]*\bdata-profile="([^"]+)"[^>]*>)[^<]*/g,
    (m, open, key) => {
      if (!(key in profileText)) throw new Error('profile.' + key + ' không được điền vào HTML');
      return open + esc(profileText[key]);
    },
  );
  html = html.replace(/<a\b(?=[^>]*\bdata-mail\b)[^>]*>/g, (tag) =>
    tag.replace(/href="[^"]*"/, 'href="mailto:' + attr(site.profile.email) + '"'));
  html = html.replace(/<a\b(?=[^>]*\bdata-github\b)[^>]*>/g, (tag) =>
    tag.replace(/href="[^"]*"/, 'href="' + attr(site.profile.github) + '"'));
  html = html.replace(
    /(<a\b[^>]*\bdata-github\b[^>]*>)@[^<]*(<\/a>)/g,
    '$1@' + esc(site.profile.handle) + '$2',
  );
  html = html.replace(
    /<title\b[^>]*\bdata-fill="([^"]+)"[^>]*>[^<]*<\/title>/g,
    (m, key) => '<title data-fill="' + key + '">' + esc(resolve(key, site)) + '</title>',
  );
  html = html.replace(/<meta\b[^>]*\bdata-fill="([^"]+)"[^>]*>/g, (tag, key) => {
    const value = attr(resolve(key, site));
    return tag.includes('content="')
      ? tag.replace(/content="[^"]*"/, 'content="' + value + '"')
      : tag.replace(/>$/, ' content="' + value + '">');
  });
  return html;
}

function jsString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function heroCode(site) {
  const c = site.heroCode;
  if (!/^[A-Za-z_$][\w$]*$/.test(c.constName)) throw new Error('heroCode.constName không hợp lệ');
  const span = (cls, text) => '<span class="' + cls + '">' + text + '</span>';
  const strs = (list) => list.map((item) => span('s', "'" + jsString(item) + "'")).join(', ');
  const lines = [
    span('k', 'const') + ' ' + span('p', esc(c.constName)) + ' = {',
    '  role: ' + span('s', "'" + jsString(c.role) + "'") + ',',
  ];
  if (c.builds?.length) lines.push('  builds: [' + strs(c.builds) + '],');
  if (c.stack?.length) lines.push('  stack: [' + strs(c.stack) + '],');
  for (const [key, value] of Object.entries(c.flags || {})) {
    const shown = value === true ? 'true' : value === false ? 'false' : "'" + jsString(value) + "'";
    lines.push('  ' + esc(key) + ': ' + span('k', shown) + ',');
  }
  lines.push('};');
  const comment = esc(apply(site.strings.vi['pf.codeComment'], site));
  return [
    '<div class="code-bar"><i></i><i></i><i></i><span>' + esc(c.filename) + '</span></div>',
    '<pre><code>' + lines.join('\n') + '\n\n<span class="c" data-i18n="pf.codeComment">' + comment + '</span></code></pre>',
  ].join('\n');
}

function noscriptHome(site) {
  const items = site.projects.map((p) =>
    '<li class="row"><a class="more" href="' + attr(p.url) + '">' + esc(p.name) + ' →</a></li>').join('\n          ');
  return '<ul class="rows">\n          ' + items + '\n        </ul>';
}

function noscriptPortfolio(site) {
  const items = site.projects.map((p) =>
    '<a href="' + attr(p.url) + '">' + esc(p.name) + '</a>').join(' · ');
  return '<p>' + items + '</p>';
}

function chips(items) {
  if (!items?.length) return '';
  return '<div class="chips">' + items.map((item) => '<span>' + esc(item) + '</span>').join('') + '</div>';
}

function projectBlock(project, lang) {
  const name = project.url
    ? '<a href="' + attr(project.url) + '">' + esc(project.name) + '</a>'
    : esc(project.name);
  const summary = L(project.summary, lang);
  return [
    '        <div class="proj">',
    '          <div class="proj-head">',
    '            <h4 class="proj-name">' + name + '</h4>',
    '            <span class="proj-kind">' + esc(L(project.kind, lang)) + '</span>',
    '          </div>',
    summary ? '          <p>' + esc(summary) + '</p>' : '',
    project.stack ? '          ' + chips(project.stack) : '',
    '        </div>',
  ].filter(Boolean).join('\n');
}

function cvArticle(site, lang) {
  const cv = site.cv;
  const hidden = lang === 'vi' ? '' : ' hidden';
  const githubLabel = site.profile.github.replace(/^https?:\/\//, '');
  const [mailUser, mailHost = ''] = site.profile.email.split('@');
  const email = esc(mailUser) + '@<wbr>' + esc(mailHost);
  const skills = site.profile.skills.map((group) =>
    '      <div class="skill"><b>' + esc(L(group.name, lang)) + '</b><span>' + esc(group.items.join(', ')) + '</span></div>').join('\n');
  const languages = cv.languages.map((item) =>
    '      <p><b>' + esc(L(item.label, lang)) + '</b> ' + esc(L(item.value, lang)) + '</p>').join('\n');
  const jobs = cv.experience.map((job) => {
    const duties = L(job.duties, lang) || [];
    const projects = (job.projects || []).map((p) => projectBlock(p, lang)).join('\n');
    return [
      '      <section class="job">',
      '        <div class="job-head">',
      '          <h3 class="job-title">' + esc(L(job.title, lang)) + '</h3>',
      '          <span class="date">' + esc(L(job.date, lang)) + '</span>',
      '        </div>',
      '        <p class="company">' + esc(L(job.company, lang)) + '</p>',
      L(job.note, lang) ? '        <p class="note">' + esc(L(job.note, lang)) + '</p>' : '',
      projects,
      duties.length ? '        <p class="label">' + esc(L(cv.labels.duties, lang)) + '</p>' : '',
      duties.length ? '        <ul>\n' + duties.map((d) => '          <li>' + esc(d) + '</li>').join('\n') + '\n        </ul>' : '',
      job.stack?.length ? '        ' + chips(job.stack) : '',
      '      </section>',
    ].filter(Boolean).join('\n');
  }).join('\n\n');
  const personal = (cv.personalProjects || []).map((p) => projectBlock(p, lang)).join('\n');
  const education = cv.education.map((item) => [
    '      <section class="job">',
    '        <div class="job-head">',
    '          <h3 class="job-title">' + esc(L(item.title, lang)) + '</h3>',
    '          <span class="date">' + esc(L(item.date, lang)) + '</span>',
    '        </div>',
    '        <p class="company">' + esc(L(item.school, lang)) + '</p>',
    '      </section>',
  ].join('\n')).join('\n');
  const awards = (cv.awards || []).map((item) => [
    '      <section class="job">',
    '        <div class="job-head">',
    '          <h3 class="job-title">' + esc(L(item.text, lang)) + '</h3>',
    '          <span class="date">' + esc(item.date) + '</span>',
    '        </div>',
    '      </section>',
  ].join('\n')).join('\n');
  const nameSub = lang === 'ja' && cv.nameLatin
    ? '\n      <p class="name-sub">' + esc(cv.nameLatin) + '</p>'
    : '';
  const comment = { vi: 'Tiếng Việt', en: 'English', ja: '日本語' }[lang];

  return `  <!-- ===================== ${comment} ===================== -->
  <article class="page" lang="${lang}"${hidden}>

    <aside class="side">
      <img class="photo" src="${attr(cv.photo)}" alt="${attr(L(cv.photoAlt, lang))}">
      <h1 class="name">${esc(L(cv.name, lang))}</h1>${nameSub}
      <p class="role">${esc(L(site.profile.role, lang))}</p>

      <ul class="contact">
        <li><svg aria-hidden="true"><use href="#i-phone"/></svg><a href="tel:${attr(cv.phone.tel)}">${esc(L(cv.phone.display, lang))}</a></li>
        <li><svg aria-hidden="true"><use href="#i-mail"/></svg><a href="mailto:${attr(site.profile.email)}">${email}</a></li>
        <li><svg aria-hidden="true"><use href="#i-linkedin"/></svg><a href="${attr(cv.linkedin.href)}">${esc(cv.linkedin.label)}</a></li>
        <li><svg aria-hidden="true"><use href="#i-github"/></svg><a href="${attr(site.profile.github)}">${esc(githubLabel)}</a></li>
        <li><svg aria-hidden="true"><use href="#i-web"/></svg><a href="${attr(cv.website.href)}">${esc(cv.website.label)}</a></li>
        <li><svg aria-hidden="true"><use href="#i-pin"/></svg><span>${esc(L(cv.location, lang))}</span></li>
      </ul>

      <h2>${esc(L(cv.labels.skills, lang))}</h2>
${skills}

      <h2>${esc(L(cv.labels.languages, lang))}</h2>
${languages}

      <h2>${esc(L(cv.labels.interests, lang))}</h2>
      <p>${esc(L(cv.interests, lang))}</p>
    </aside>

    <main class="main">
      <h2>${esc(L(cv.labels.summary, lang))}</h2>
      <p class="summary">${esc(L(cv.summary, lang))}</p>

      <h2>${esc(L(cv.labels.experience, lang))}</h2>

${jobs}

      <h2>${esc(L(cv.labels.personal, lang))}</h2>

${personal}

      <h2>${esc(L(cv.labels.education, lang))}</h2>
${education}
${awards ? `\n      <h2>${esc(L(cv.labels.awards, lang))}</h2>\n${awards}` : ''}
    </main>

  </article>`;
}

function cvUi(site) {
  const pdf = JSON.stringify(site.cv.pdfBase);
  const ui = JSON.stringify(site.cv.ui, null, 2).replace(/\n/g, '\n      ');
  return '      var PDF_BASE = ' + pdf + ';\n      var UI = ' + ui + ';';
}

function renderCvHtml(template, site) {
  let text = template.replace(/\r\n/g, '\n');
  text = fillPage(text, site);
  text = fillRegion(text, 'cv-articles', ['vi', 'en', 'ja'].map((lang) => cvArticle(site, lang)).join('\n\n'));
  text = fillJsRegion(text, 'cv-ui', cvUi(site));
  const fileName = site.cv.pdfBase + '-VI.pdf';
  text = text.replace(/<a\b[^>]*\bid="dl"[^>]*>/g, (tag) =>
    tag.replace(/href="[^"]*"/, 'href="assets/cv/' + fileName + '"')
      .replace(/download="[^"]*"/, 'download="' + fileName + '"'));
  return text;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

export { loadSiteFrom, renderCvHtml, root };

if (isDirectRun()) {
const site = loadSite();
const pages = ['index.html', 'about.html', 'projects.html', 'portfolio.html', '404.html', 'cv.html'];

for (const name of pages) {
  const file = path.join(root, name);
  let { text, nl } = readText(file);
  text = fillPage(text, site);
  if (name === 'index.html') text = fillRegion(text, 'noscript-home', noscriptHome(site));
  if (name === 'portfolio.html') {
    text = fillRegion(text, 'hero-code', heroCode(site));
    text = fillRegion(text, 'noscript-portfolio', noscriptPortfolio(site));
  }
  if (name === 'cv.html') {
    text = fillRegion(text, 'cv-articles', ['vi', 'en', 'ja'].map((lang) => cvArticle(site, lang)).join('\n\n'));
    text = fillJsRegion(text, 'cv-ui', cvUi(site));
    const fileName = site.cv.pdfBase + '-VI.pdf';
    text = text.replace(/<a\b[^>]*\bid="dl"[^>]*>/g, (tag) =>
      tag.replace(/href="[^"]*"/, 'href="assets/cv/' + fileName + '"')
        .replace(/download="[^"]*"/, 'download="' + fileName + '"'));
  }
  writeText(file, text, nl);
  console.log('đã điền', name);
}
}
