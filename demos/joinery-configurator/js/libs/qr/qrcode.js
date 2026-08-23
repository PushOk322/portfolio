'use strict';

// Minimal QR Code generator — byte mode only, automatic version and mask selection.
// Ported from Project Nayuki's "QR Code generator library" (MIT). Trimmed to byte mode,
// which covers any URL. Same-origin, zero-dependency: this is what lets the desktop AR
// popup show a scannable code without a CDN. See docs/superpowers/specs 2026-07-23.
//
// Public API:
//   encodeText(text, ecl) -> QrCode      (ecl: 'L' | 'M' | 'Q' | 'H', default 'M')
//   QrCode#size                          module count per side
//   QrCode#getModule(x, y) -> boolean    true = dark
//   toDataURL(qr, { scale, margin, dark, light }) -> PNG data URL via canvas

const ECL = { L: 0, M: 1, Q: 2, H: 3 };
const ECL_FORMAT_BITS = { 0: 1, 1: 0, 2: 3, 3: 2 }; // ecl ordinal -> 2-bit format field

// ECC codewords per block, indexed [eclOrdinal][version]. Version 0 is unused padding.
const ECC_CODEWORDS_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

const NUM_ERROR_CORRECTION_BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

const MIN_VERSION = 1;
const MAX_VERSION = 40;

function getNumRawDataModules(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8)
    - ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
}

// --- Reed-Solomon over GF(256), primitive polynomial 0x11D ---

function reedSolomonComputeDivisor(degree) {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data, divisor) {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < result.length; i += 1) {
      result[i] ^= reedSolomonMultiply(divisor[i], factor);
    }
  }
  return result;
}

function reedSolomonMultiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xFF;
}

// --- Bit buffer ---

function appendBits(val, len, bb) {
  for (let i = len - 1; i >= 0; i -= 1) bb.push((val >>> i) & 1);
}

// --- QrCode ---

class QrCode {
  constructor(version, eclOrdinal, dataCodewords, mask) {
    this.version = version;
    this.size = version * 4 + 17;
    this.ecl = eclOrdinal;
    this._modules = [];
    this._isFunction = [];
    for (let i = 0; i < this.size; i += 1) {
      this._modules.push(new Array(this.size).fill(false));
      this._isFunction.push(new Array(this.size).fill(false));
    }

    this._drawFunctionPatterns();
    const allCodewords = this._addEccAndInterleave(dataCodewords);
    this._drawCodewords(allCodewords);

    // Automatic mask: lowest penalty of the 8.
    let chosen = mask;
    if (chosen === -1) {
      let minPenalty = Infinity;
      for (let i = 0; i < 8; i += 1) {
        this._applyMask(i);
        this._drawFormatBits(i);
        const penalty = this._getPenaltyScore();
        if (penalty < minPenalty) { chosen = i; minPenalty = penalty; }
        this._applyMask(i); // undo (XOR is its own inverse)
      }
    }
    this.mask = chosen;
    this._applyMask(chosen);
    this._drawFormatBits(chosen);
    this._isFunction = null;
  }

  getModule(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this._modules[y][x];
  }

  _setFunctionModule(x, y, isDark) {
    this._modules[y][x] = isDark;
    this._isFunction[y][x] = true;
  }

  _drawFunctionPatterns() {
    const size = this.size;
    for (let i = 0; i < size; i += 1) {
      this._setFunctionModule(6, i, i % 2 === 0);
      this._setFunctionModule(i, 6, i % 2 === 0);
    }
    this._drawFinderPattern(3, 3);
    this._drawFinderPattern(size - 4, 3);
    this._drawFinderPattern(3, size - 4);

    const alignPos = this._getAlignmentPatternPositions();
    const numAlign = alignPos.length;
    for (let i = 0; i < numAlign; i += 1) {
      for (let j = 0; j < numAlign; j += 1) {
        if (!((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))) {
          this._drawAlignmentPattern(alignPos[i], alignPos[j]);
        }
      }
    }

    this._drawFormatBits(0); // dummy, real bits after masking
    this._drawVersion();
  }

  _drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this._setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  _drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        this._setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  _getAlignmentPatternPositions() {
    if (this.version === 1) return [];
    const numAlign = Math.floor(this.version / 7) + 2;
    const step = Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  _drawFormatBits(mask) {
    const data = (ECL_FORMAT_BITS[this.ecl] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i += 1) this._setFunctionModule(8, i, ((bits >>> i) & 1) !== 0);
    this._setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this._setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this._setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i += 1) this._setFunctionModule(14 - i, 8, ((bits >>> i) & 1) !== 0);

    for (let i = 0; i < 8; i += 1) this._setFunctionModule(this.size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i += 1) this._setFunctionModule(8, this.size - 15 + i, ((bits >>> i) & 1) !== 0);
    this._setFunctionModule(8, this.size - 8, true);
  }

  _drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    const bits = (this.version << 12) | rem;

    for (let i = 0; i < 18; i += 1) {
      const bit = ((bits >>> i) & 1) !== 0;
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this._setFunctionModule(a, b, bit);
      this._setFunctionModule(b, a, bit);
    }
  }

  _addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.ecl;
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    let k = 0;
    for (let i = 0; i < numBlocks; i += 1) {
      const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = data.slice(k, k + datLen);
      k += datLen;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      const block = Array.from(dat);
      if (i < numShortBlocks) block.push(0);
      for (const b of ecc) block.push(b);
      blocks.push(block);
    }

    const result = [];
    const maxLen = shortBlockLen + 1;
    for (let i = 0; i < maxLen; i += 1) {
      for (let j = 0; j < blocks.length; j += 1) {
        // Skip the padding slot in short blocks' data region.
        if (!(i === shortBlockLen - blockEccLen && j < numShortBlocks)) {
          result.push(blocks[j][i]);
        }
      }
    }
    return result;
  }

  _drawCodewords(data) {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      const col = right === 6 ? 5 : right;
      for (let vert = 0; vert < this.size; vert += 1) {
        for (let j = 0; j < 2; j += 1) {
          const x = col - j;
          const upward = ((col + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this._isFunction[y][x] && i < data.length * 8) {
            this._modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i += 1;
          }
        }
      }
    }
  }

  _applyMask(mask) {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this._isFunction[y][x]) continue;
        let invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = false;
        }
        if (invert) this._modules[y][x] = !this._modules[y][x];
      }
    }
  }

  _getPenaltyScore() {
    const size = this.size;
    let result = 0;
    const mods = this._modules;

    // Adjacent same-color runs, rows then columns.
    for (let y = 0; y < size; y += 1) {
      let runColor = false;
      let runX = 0;
      const runHistory = new Array(7).fill(0);
      for (let x = 0; x < size; x += 1) {
        if (mods[y][x] === runColor) {
          runX += 1;
          if (runX === 5) result += 3;
          else if (runX > 5) result += 1;
        } else {
          this._finderPenaltyAddHistory(runX, runHistory);
          if (!runColor) result += this._finderPenaltyCountPatterns(runHistory) * 40;
          runColor = mods[y][x];
          runX = 1;
        }
      }
      result += this._finderPenaltyTerminateAndCount(runColor, runX, runHistory) * 40;
    }
    for (let x = 0; x < size; x += 1) {
      let runColor = false;
      let runY = 0;
      const runHistory = new Array(7).fill(0);
      for (let y = 0; y < size; y += 1) {
        if (mods[y][x] === runColor) {
          runY += 1;
          if (runY === 5) result += 3;
          else if (runY > 5) result += 1;
        } else {
          this._finderPenaltyAddHistory(runY, runHistory);
          if (!runColor) result += this._finderPenaltyCountPatterns(runHistory) * 40;
          runColor = mods[y][x];
          runY = 1;
        }
      }
      result += this._finderPenaltyTerminateAndCount(runColor, runY, runHistory) * 40;
    }

    // 2x2 blocks of one color.
    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const c = mods[y][x];
        if (c === mods[y][x + 1] && c === mods[y + 1][x] && c === mods[y + 1][x + 1]) result += 3;
      }
    }

    // Balance of dark modules.
    let dark = 0;
    for (const row of mods) for (const cell of row) if (cell) dark += 1;
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * 10;
    return result;
  }

  _finderPenaltyCountPatterns(runHistory) {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
      + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
  }

  _finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
    let len = currentRunLength;
    if (currentRunColor) {
      this._finderPenaltyAddHistory(len, runHistory);
      len = 0;
    }
    len += this.size;
    this._finderPenaltyAddHistory(len, runHistory);
    return this._finderPenaltyCountPatterns(runHistory);
  }

  _finderPenaltyAddHistory(currentRunLength, runHistory) {
    if (runHistory[0] === 0) currentRunLength += this.size; // add light border to first run
    runHistory.copyWithin(1, 0);
    runHistory[0] = currentRunLength;
  }
}

function encodeText(text, eclName = 'M') {
  const eclOrdinal = ECL[eclName] ?? ECL.M;
  const bytes = new TextEncoder().encode(text);

  // Pick the smallest version that fits at this ECL (byte mode).
  let version = MIN_VERSION;
  let dataCapacityBits;
  for (; ; version += 1) {
    if (version > MAX_VERSION) throw new RangeError('QR data too long');
    dataCapacityBits = getNumDataCodewords(version, eclOrdinal) * 8;
    const charCountBits = version < 10 ? 8 : 16;
    const usedBits = 4 + charCountBits + bytes.length * 8;
    if (usedBits <= dataCapacityBits) break;
  }

  const bb = [];
  appendBits(0x4, 4, bb); // byte mode indicator
  appendBits(bytes.length, version < 10 ? 8 : 16, bb);
  for (const b of bytes) appendBits(b, 8, bb);

  // Terminator + bit/byte padding.
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - (bb.length % 8)) % 8, bb);
  for (let pad = 0xEC; bb.length < dataCapacityBits; pad ^= 0xEC ^ 0x11) appendBits(pad, 8, bb);

  const dataCodewords = new Uint8Array(bb.length / 8);
  for (let i = 0; i < bb.length; i += 1) dataCodewords[i >>> 3] |= bb[i] << (7 - (i & 7));

  return new QrCode(version, eclOrdinal, dataCodewords, -1);
}

function toDataURL(qr, { scale = 6, margin = 4, dark = '#000000', light = '#ffffff' } = {}) {
  const dim = (qr.size + margin * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = dark;
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (qr.getModule(x, y)) {
        ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
      }
    }
  }
  return canvas.toDataURL('image/png');
}

export { encodeText, toDataURL };
