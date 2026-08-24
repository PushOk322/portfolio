import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dirname, join as pjoin } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(pjoin(HERE, '..', 'demos', 'orbital-slice', 'package.json'));
const sharp = require('sharp');

const dir = process.argv[2];
// Only the 3D viewport, so panel highlights (which always change) don't count.
const REGION = { left: 0, top: 0, width: 1270, height: 900 };

const files = readdirSync(dir).filter(f => f.endsWith('.png')).sort();
let prev = null, prevName = null;
for (const f of files) {
  const raw = await sharp(join(dir, f)).extract(REGION).raw().toBuffer();
  if (prev) {
    let changed = 0;
    for (let i = 0; i < raw.length; i += 3) {
      if (Math.abs(raw[i]-prev[i]) + Math.abs(raw[i+1]-prev[i+1]) + Math.abs(raw[i+2]-prev[i+2]) > 24) changed++;
    }
    const pct = (changed / (raw.length / 3) * 100).toFixed(2);
    const verdict = pct < 0.05 ? '  <-- NO VISIBLE CHANGE' : '';
    console.log(`${String(pct).padStart(6)}%  ${prevName}  ->  ${f}${verdict}`);
  }
  prev = raw; prevName = f;
}
