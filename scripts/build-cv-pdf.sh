#!/bin/sh
# Builds the downloadable CV PDFs (one per language) from cv.html with headless Chrome.
# Run again after any change to cv.html:  sh scripts/build-cv-pdf.sh
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
OUT="$ROOT/assets/cv"
mkdir -p "$OUT"

export ROOT
BASE=$(node -e 'const fs=require("fs");const vm=require("vm");const s={window:{}};vm.runInNewContext(fs.readFileSync(process.env.ROOT+"/assets/js/data.js","utf8"),s);process.stdout.write(s.window.SITE.cv.pdfBase)')

for lang in vi en ja; do
  file="$OUT/${BASE}-$(echo "$lang" | tr a-z A-Z).pdf"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --run-all-compositor-stages-before-draw --virtual-time-budget=10000 \
    --print-to-pdf="$file" "file://$ROOT/cv.html?lang=$lang" 2>/dev/null
  echo "$file"
done
