// Traces a JPEG into an SVG.
// yarn convert_img ten-anh    finds ten-anh.jpg or ten-anh.jpeg in jpeg-to-svg/input
// yarn convert_img            every jpg and jpeg in that folder
// The SVG is written to jpeg-to-svg/output, using the image name.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js');
const tracer = require('imagetracerjs');

const here = path.dirname(fileURLToPath(import.meta.url));
const inputDir = path.join(here, 'input');
const outputDir = path.join(here, 'output');
const maxEdge = 1024;
const extensions = ['.jpg', '.jpeg'];

function stemOf(file) {
  return path.basename(file, path.extname(file));
}

function listImages() {
  if (!fs.existsSync(inputDir)) return [];
  return fs.readdirSync(inputDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(inputDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function resolveInput(name) {
  const base = path.basename(name.trim());
  if (!base || base === '.' || base === '..') throw new Error('Thiếu tên ảnh');
  const lower = base.toLowerCase();
  let stem = base;
  if (lower.endsWith('.jpeg')) stem = base.slice(0, -5);
  else if (lower.endsWith('.jpg')) stem = base.slice(0, -4);
  else if (path.extname(base)) throw new Error(base + ' không phải ảnh jpg hoặc jpeg');
  const found = listImages().filter((file) => stemOf(file).toLowerCase() === stem.toLowerCase());
  if (found.length > 1) throw new Error(stem + ' có cả file .jpg và .jpeg trong jpeg-to-svg/input');
  if (!found.length) throw new Error('Không thấy ' + stem + '.jpg hoặc ' + stem + '.jpeg trong jpeg-to-svg/input');
  return found[0];
}

function resize(src, sw, sh, dw, dh) {
  const dst = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, (y + 0.5) * sh / dh - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, (x + 0.5) * sw / dw - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const i = (y * dw + x) * 4;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let c = 0; c < 4; c++) {
        const value = src[i00 + c] * (1 - fx) * (1 - fy)
          + src[i10 + c] * fx * (1 - fy)
          + src[i01 + c] * (1 - fx) * fy
          + src[i11 + c] * fx * fy;
        dst[i + c] = Math.round(value);
      }
    }
  }
  return dst;
}

function toSvg(file) {
  let decoded;
  try {
    decoded = jpeg.decode(fs.readFileSync(file), { useTArray: true, formatAsRGBA: true });
  } catch (error) {
    throw new Error(path.basename(file) + ' không phải JPEG hợp lệ');
  }
  const width = decoded.width;
  const height = decoded.height;
  if (!width || !height) throw new Error(path.basename(file) + ' không có kích thước');
  const edge = Math.max(width, height);
  const fit = edge > maxEdge ? maxEdge / edge : 1;
  const tracedWidth = Math.max(1, Math.round(width * fit));
  const tracedHeight = Math.max(1, Math.round(height * fit));
  const pixels = fit < 1
    ? resize(decoded.data, width, height, tracedWidth, tracedHeight)
    : new Uint8ClampedArray(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
  const svg = tracer.imagedataToSVG(
    { width: tracedWidth, height: tracedHeight, data: pixels },
    {
      numberofcolors: 16,
      pathomit: 8,
      ltres: 1,
      qtres: 1,
      linefilter: true,
      scale: width / tracedWidth,
      roundcoords: 1,
      viewbox: true,
      desc: false,
    },
  );
  return svg.replace('<svg ', '<svg width="' + width + '" height="' + height + '" ');
}

function convertOne(file) {
  const svgPath = path.join(outputDir, stemOf(file) + '.svg');
  fs.writeFileSync(svgPath, toSvg(file));
  console.log('đã tạo', path.relative(path.resolve(here, '..'), svgPath));
}

const requested = process.argv.slice(2).filter((arg) => arg !== '--').join(' ').trim();

fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

let files;
try {
  files = requested ? [resolveInput(requested)] : listImages();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!files.length) {
  console.error('jpeg-to-svg/input chưa có ảnh jpg hoặc jpeg');
  process.exit(1);
}

const groups = new Map();
for (const file of files) {
  const key = stemOf(file).toLowerCase();
  const group = groups.get(key) || [];
  group.push(file);
  groups.set(key, group);
}

let failed = 0;
for (const group of groups.values()) {
  if (group.length > 1) {
    failed += 1;
    console.error(stemOf(group[0]) + ' có cả file .jpg và .jpeg trong jpeg-to-svg/input');
    continue;
  }
  const file = group[0];
  try {
    convertOne(file);
  } catch (error) {
    failed += 1;
    console.error(path.basename(file) + ': ' + error.message);
  }
}
if (failed) process.exit(1);
