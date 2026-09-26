#!/usr/bin/env node
// Generate every Dataverket logo file from one definition.
//
// The shapes live here, once. The SVGs in build/ are output: do not edit them,
// and do not paste the path data into a template - run this instead.
//
//     task marks
//
// The name is converted to outlines, so the logo-with-name carries no webfont
// dependency and cannot reflow: it is one shape that scales as a unit.
// fontkit reads the WOFF2 that `task fonts` puts in vendor/, and its layout()
// applies the font's real kerning from GPOS - Inter has no legacy `kern`
// table, so anything that only reads that one silently kerns nothing.

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// createRequire, not a bare import: ESM ignores NODE_PATH, and fontkit lives
// in the image rather than next to this file. CommonJS resolution still
// honours it, so the script stays where the repo is mounted.
const fontkit = createRequire(import.meta.url)('fontkit');

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'build');
const FONT = join(HERE, 'vendor', 'fonts', 'files', 'inter-latin-600-normal.woff2');
const WORD = 'Dataverket';

// The tower, and the tower flattened for small sizes. Both sit in the same
// 848x1167 box with the same ink bounds, so they swap without anything jumping.
const TOWER = 'M89 120H249V250H349V120H499V250H599V120H759V280L699 380L710 617'
            + 'H476V517A52 52 0 0 0 372 517V617H138L149 380L89 280Z';
const TOWER_FLAT = 'M89 120H249V250H349V120H499V250H599V120H759V617H89Z';
const BARS = '<rect x="29" y="663" width="791" height="196" rx="48"/>'
           + '<rect x="29" y="951" width="791" height="196" rx="48"/>';

const BOX = [0, 0, 848, 1167];        // the viewBox the tower alone is drawn in
const INK = [29, 120, 820, 1147];     // what it actually covers: x0 y0 x1 y1
const INK_H = INK[3] - INK[1];

// Cap-height of the name as a fraction of the logo's ink height, and the gap
// between them in the same unit. Reviewed by eye at 48 and 64 px: the rook is
// bottom-heavy, so a name matched to its cap-height reads undersized.
const CAP_RATIO = 0.56;
const GAP_RATIO = 0.30;

const VARIANTS = { light: '#0a2a5e', dark: '#ffffff', '': 'currentColor' };

const num = (v) => String(Math.round(v * 100) / 100);

function svg(view, fill, body, title, cls) {
  // The currentColor variants carry the class they need when inlined, so a
  // service can embed the file and print it with no post-processing. The
  // fixed-colour ones are for <img>, email and favicons, where a class would
  // do nothing.
  const attr = cls && fill === 'currentColor' ? ` class="${cls}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.map(num).join(' ')}"`
       + ` fill="${fill}"${attr} role="img">\n  <title>${title}</title>\n  ${body}\n</svg>\n`;
}

function write(stem, view, body, title, cls) {
  for (const [suffix, fill] of Object.entries(VARIANTS)) {
    const name = suffix ? `${stem}-${suffix}.svg` : `${stem}.svg`;
    writeFileSync(join(OUT, name), svg(view, fill, body, title, cls));
    console.log(`  build/${name}`);
  }
}

// 'Dataverket' as outlines, placed to the right of the logo.
function name() {
  const font = fontkit.openSync(FONT);
  const run = font.layout(WORD);                 // GPOS kerning applied here
  const scale = (CAP_RATIO * INK_H) / font.capHeight;

  // The name's cap box and the logo's ink share a centre line.
  const baseline = (INK[1] + INK[3]) / 2 + (CAP_RATIO * INK_H) / 2;
  const origin = INK[2] + GAP_RATIO * INK_H - run.bbox.minX * scale;

  const paths = [];
  let x = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    const pos = run.positions[i];
    // Font space is y-up, SVG is y-down, hence the negative vertical scale.
    const path = run.glyphs[i].path.transform(
      scale, 0, 0, -scale,
      origin + (x + pos.xOffset) * scale,
      baseline - pos.yOffset * scale,
    );
    const d = path.toSVG();
    if (d) paths.push(d);
    x += pos.xAdvance;
  }

  const top = Math.min(INK[1], baseline - run.bbox.maxY * scale);
  const view = [INK[0], top, origin + run.bbox.maxX * scale - INK[0], INK[3] - top];
  // data-text flags the part that is lettering rather than art. Designsystemet
  // does the same on its own, so a theme can fill the text from a
  // token while brand-coloured shapes keep their fixed fills. Ours is
  // monochrome today; the hook costs nothing and means we never have to
  // re-cut the file if that changes.
  return [view, `<path data-text="true" d="${paths.join(' ')}"/>`];
}

mkdirSync(OUT, { recursive: true });

console.log('logo');
write('logo', BOX, `<path d="${TOWER}"/>${BARS}`, 'Dataverket');
console.log('icon');
write('glyph', BOX, `<path d="${TOWER_FLAT}"/>${BARS}`, 'Dataverket', 'dvk-brand-mark');
console.log('logo with name');
const [view, word] = name();
write('lockup', view, `<path d="${TOWER}"/>${BARS}\n  ${word}`, 'Dataverket', 'dvk-brand-lockup');
