// Builds one PDF per folder in cv/input.
// yarn cv_genarate            every folder
// yarn cv_genarate ten-cv     the folder cv/input/ten-cv
// Each folder holds data.js (same shape as assets/js/data.js) plus files it points at, such as the photo.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadSiteFrom, renderCvHtml, root } from './export-content.mjs';

const inputDir = path.join(root, 'cv', 'input');
const outputDir = path.join(root, 'cv', 'output');

function browsers() {
  const local = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  return [
    process.env.CHROME,
    path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);
}

function findBrowser() {
  for (const file of browsers()) {
    if (fs.existsSync(file)) return file;
  }
  throw new Error('Không tìm thấy Chrome. Đặt biến môi trường CHROME trỏ tới chrome.exe.');
}

function listInputs() {
  if (!fs.existsSync(inputDir)) return [];
  return fs.readdirSync(inputDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function resolveInput(name) {
  const base = path.basename(name.trim());
  const dir = path.join(inputDir, base);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error('Không thấy thư mục ' + base + ' trong cv/input');
  }
  return dir;
}

function dataFileIn(dir) {
  for (const fileName of ['data.js', 'data.mjs']) {
    const file = path.join(dir, fileName);
    if (fs.existsSync(file)) return file;
  }
  throw new Error(path.basename(dir) + ' thiếu data.js');
}

function printPdf(htmlPath, pdfPath) {
  const browser = findBrowser();
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=10000',
    '--print-to-pdf=' + pdfPath,
    pathToFileURL(htmlPath).href,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Trình duyệt thoát với mã ' + result.status);
  if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size < 1000) {
    throw new Error('Không tạo được ' + pdfPath);
  }
}

function buildOne(dir) {
  const dataFile = dataFileIn(dir);
  const site = loadSiteFrom(dataFile);
  if (!site.profile || !site.cv) throw new Error(path.basename(dir) + ' thiếu profile hoặc cv');
  const template = fs.readFileSync(path.join(root, 'cv.html'), 'utf8');
  let html = renderCvHtml(template, site);
  const base = pathToFileURL(dir + path.sep).href;
  html = html.replace('<head>', '<head>\n  <base href="' + base + '">');
  fs.mkdirSync(outputDir, { recursive: true });
  const stem = path.basename(dir);
  const pdfPath = path.join(outputDir, stem + '.pdf');
  const tmpPath = path.join(os.tmpdir(), 'quacfolio-cv-' + stem + '.html');
  fs.writeFileSync(tmpPath, html);
  try {
    printPdf(tmpPath, pdfPath);
  } finally {
    fs.rmSync(tmpPath, { force: true });
  }
  console.log('đã tạo', path.relative(root, pdfPath));
}

fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const requested = process.argv.slice(2).filter((arg) => arg !== '--').join(' ').trim();
let folders;
try {
  folders = requested
    ? [resolveInput(requested)]
    : listInputs().map((name) => path.join(inputDir, name));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!folders.length) {
  console.error('cv/input chưa có thư mục CV');
  process.exit(1);
}

let failed = 0;
for (const folder of folders) {
  try {
    buildOne(folder);
  } catch (error) {
    failed += 1;
    console.error(path.basename(folder) + ': ' + error.message);
  }
}
if (failed) process.exit(1);
