# Documenso CE with Chromium for document sealing (Alpine base image).
# Fixes "Processing document" spinner — documenso/documenso#2060
FROM documenso/documenso:latest

USER root

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Symlink Alpine chromium to paths Playwright expects (discovered from playwright-core/browsers.json).
RUN CHROME="$(command -v chromium-browser || command -v chromium)" \
    && export CHROME \
    && node -e " \
const { execSync } = require('child_process'); \
const fs = require('fs'); \
const chrome = process.env.CHROME; \
const revs = new Set(['1169','1181','1194','1195','1200']); \
let browsersJson = ''; \
try { \
  browsersJson = execSync(\"find / -path '*/playwright-core/browsers.json' 2>/dev/null | head -1\").toString().trim(); \
} catch {} \
if (browsersJson && fs.existsSync(browsersJson)) { \
  const data = JSON.parse(fs.readFileSync(browsersJson, 'utf8')); \
  for (const b of Object.values(data)) { \
    if (b.revision) revs.add(String(b.revision)); \
  } \
  console.log('Playwright revisions:', [...revs].join(', ')); \
} \
for (const v of revs) { \
  for (const [subdir, name] of [['chromium_headless_shell','headless_shell'],['chromium','chrome']]) { \
    const dir = '/home/nodejs/.cache/ms-playwright/' + subdir + '-' + v + '/chrome-linux'; \
    fs.mkdirSync(dir, { recursive: true }); \
    try { fs.unlinkSync(dir + '/' + name); } catch {} \
    fs.symlinkSync(chrome, dir + '/' + name); \
  } \
} \
" \
    && chown -R nodejs:nodejs /home/nodejs/.cache \
    && ls -la /home/nodejs/.cache/ms-playwright/

USER nodejs
