const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP_TABLE[i] = EXP_TABLE[i - 255];
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const coeff: number[] = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++)
    for (let j = 0; j < p2.length; j++)
      coeff[i + j] ^= gfMul(p1[i], p2[j]);
  return coeff;
}

function polyMod(divident: number[], divisor: number[]): number[] {
  let result: number[] = [...divident];
  while (result.length - divisor.length >= 0) {
    const coeff = result[0];
    for (let i = 0; i < divisor.length; i++) result[i] ^= gfMul(divisor[i], coeff);
    let offset = 0;
    while (offset < result.length && result[offset] === 0) offset++;
    result = result.slice(offset);
  }
  return result;
}

function generateECPolynomial(degree: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < degree; i++) poly = polyMul(poly, [1, EXP_TABLE[i]]);
  return poly;
}

function reedSolomonEncode(data: Uint8Array, degree: number): Uint8Array {
  const genPoly = generateECPolynomial(degree);
  const padded: number[] = [...data, ...new Array(degree).fill(0)];
  const remainder = polyMod(padded, genPoly);
  const start = degree - remainder.length;
  const buff = new Uint8Array(degree);
  if (start >= 0) buff.set(remainder, start);
  return buff;
}

const CODEWORDS_COUNT = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706];

function getSymbolSize(version: number): number { return version * 4 + 17; }
function getSymbolTotalCodewords(version: number): number { return CODEWORDS_COUNT[version]; }

const EC_BLOCKS = [
  1,1,1,1, 1,1,1,1, 1,1,2,2, 1,2,2,4, 1,2,4,4, 2,4,4,4, 2,4,6,5, 2,4,6,6, 2,5,8,8, 4,5,8,8,
  4,5,8,11, 4,8,10,11, 4,9,12,16, 4,9,16,16, 6,10,12,18, 6,10,17,16, 6,11,16,19, 6,13,18,21, 7,14,21,25, 8,16,20,25,
  8,17,23,25, 9,17,23,34, 9,18,25,30, 10,20,27,32, 12,21,29,35, 12,23,34,37, 12,25,34,40, 13,26,35,42, 14,28,38,45, 15,29,40,48,
  16,31,43,51, 17,33,45,54, 18,35,48,57, 19,37,51,60, 19,38,53,63, 20,40,56,66, 21,43,59,70, 22,45,62,74, 24,47,65,77, 25,49,68,81
];
const EC_CODEWORDS = [
  7,10,13,17, 10,16,22,28, 15,26,36,44, 20,36,52,64, 26,48,72,88, 36,64,96,112, 40,72,108,130, 48,88,132,156, 60,110,160,192, 72,130,192,224,
  80,150,224,264, 96,176,260,308, 104,198,288,352, 120,216,320,384, 132,240,360,432, 144,280,408,480, 168,308,448,532, 180,338,504,588, 196,364,546,650, 224,416,600,700,
  224,442,644,750, 252,476,690,816, 270,504,750,900, 300,560,810,960, 312,588,870,1050, 336,644,952,1110, 360,700,1020,1200, 390,728,1050,1260, 420,784,1140,1350, 450,812,1200,1440,
  480,868,1290,1530, 510,924,1350,1620, 540,980,1440,1710, 570,1036,1530,1800, 570,1064,1590,1890, 600,1120,1680,1980, 630,1204,1770,2100, 660,1260,1860,2220, 720,1316,1950,2310, 750,1372,2040,2430
];

function getECBlocksCount(version: number, eclIdx: number): number { return EC_BLOCKS[(version - 1) * 4 + eclIdx]; }
function getECCodewordsCount(version: number, eclIdx: number): number { return EC_CODEWORDS[(version - 1) * 4 + eclIdx]; }

const ECL = { M: 0, L: 1, Q: 3, H: 2 };

function getCharCountIndicator(version: number): number { return version < 10 ? 8 : 16; }

class BitBuffer {
  buffer: number[] = [];
  length = 0;
  put(num: number, length: number) {
    for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
  }
  putBit(bit: boolean) {
    const idx = Math.floor(this.length / 8);
    if (this.buffer.length <= idx) this.buffer.push(0);
    if (bit) this.buffer[idx] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
  getLengthInBits(): number { return this.length; }
}

class BitMatrix {
  size: number;
  data: Uint8Array;
  reserved: Uint8Array;
  constructor(size: number) {
    this.size = size;
    this.data = new Uint8Array(size * size);
    this.reserved = new Uint8Array(size * size);
  }
  set(row: number, col: number, value: boolean, reserved?: boolean) {
    const idx = row * this.size + col;
    this.data[idx] = value ? 1 : 0;
    if (reserved) this.reserved[idx] = 1;
  }
  get(row: number, col: number): number { return this.data[row * this.size + col]; }
  xor(row: number, col: number, value: boolean) { this.data[row * this.size + col] ^= value ? 1 : 0; }
  isReserved(row: number, col: number): boolean { return this.reserved[row * this.size + col] === 1; }
  forEach(fn: (row: number, col: number, value: number) => void) {
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) fn(r, c, this.data[r * this.size + c]);
  }
}

function setupFinderPattern(matrix: BitMatrix) {
  for (const [row, col] of [[0, 0], [0, matrix.size - 7], [matrix.size - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      if (row + r < 0 || row + r >= matrix.size) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c < 0 || col + c >= matrix.size) continue;
        const v = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        matrix.set(row + r, col + c, v, true);
      }
    }
  }
}

function setupTimingPattern(matrix: BitMatrix) {
  const size = matrix.size;
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0;
    matrix.set(i, 6, v, true);
    matrix.set(6, i, v, true);
  }
}

function setupAlignmentPattern(matrix: BitMatrix, version: number) {
  const pos: number[][] = [];
  if (version >= 2) {
    const intervals = Math.floor(version / 7) + 2;
    const step = version === 2 ? 12 : Math.ceil((version * 4 + 17 - 14) / (intervals - 1));
    const coords: number[] = [6];
    let next = 6;
    while (next + step < getSymbolSize(version) - 7) { next += step; coords.push(next); }
    coords.push(getSymbolSize(version) - 7);
    for (const r of coords) for (const c of coords) pos.push([r, c]);
  }
  for (const [row, col] of pos) {
    if ((row < 9 && col < 9) || (row < 9 && col >= matrix.size - 8) || (row >= matrix.size - 8 && col < 9)) continue;
    for (let r = -2; r <= 2; r++)
      for (let c = -2; c <= 2; c++)
        matrix.set(row + r, col + c, Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0), true);
  }
}

const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

function getBCHDigit(data: number): number {
  let digit = 0;
  while (data !== 0) { digit++; data >>>= 1; }
  return digit;
}

function getEncodedFormatBits(ecl: number, mask: number): number {
  const data = (ecl << 3) | mask;
  let d = data << 10;
  const G15_BCH = getBCHDigit(G15);
  while (getBCHDigit(d) - G15_BCH >= 0) d ^= (G15 << (getBCHDigit(d) - G15_BCH));
  return ((data << 10) | d) ^ G15_MASK;
}

function setupFormatInfo(matrix: BitMatrix, ecl: number, maskPattern: number) {
  const bits = getEncodedFormatBits(ecl, maskPattern);
  const size = matrix.size;
  for (let i = 0; i < 15; i++) {
    const mod = ((bits >> i) & 1) === 1;
    if (i < 6) matrix.set(i, 8, mod, true);
    else if (i < 8) matrix.set(i + 1, 8, mod, true);
    else matrix.set(size - 15 + i, 8, mod, true);
    if (i < 8) matrix.set(8, size - i - 1, mod, true);
    else if (i < 9) matrix.set(8, 15 - i - 1 + 1, mod, true);
    else matrix.set(8, 15 - i - 1, mod, true);
  }
  matrix.set(size - 8, 8, true, true);
}

function setupData(matrix: BitMatrix, data: Uint8Array) {
  const size = matrix.size;
  let inc = -1;
  let row = size - 1;
  let bitIndex = 7;
  let byteIndex = 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        if (!matrix.isReserved(row, col - c)) {
          let dark = false;
          if (byteIndex < data.length) dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
          matrix.set(row, col - c, dark);
          bitIndex--;
          if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
        }
      }
      row += inc;
      if (row < 0 || row >= size) { row -= inc; inc = -inc; break; }
    }
  }
}

function createCodewords(buffer: BitBuffer, version: number, eclIdx: number): Uint8Array {
  const totalCodewords = getSymbolTotalCodewords(version);
  const ecTotalCodewords = getECCodewordsCount(version, eclIdx);
  const dataTotalCodewords = totalCodewords - ecTotalCodewords;
  const ecTotalBlocks = getECBlocksCount(version, eclIdx);
  const blocksInGroup2 = totalCodewords % ecTotalBlocks;
  const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
  const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
  const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
  const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
  const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;

  const srcData = new Uint8Array(buffer.buffer);
  let offset = 0;
  const dcData: Uint8Array[] = [];
  const ecData: Uint8Array[] = [];
  let maxDataSize = 0;

  for (let b = 0; b < ecTotalBlocks; b++) {
    const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
    dcData.push(srcData.slice(offset, offset + dataSize));
    ecData.push(reedSolomonEncode(dcData[b], ecCount));
    offset += dataSize;
    maxDataSize = Math.max(maxDataSize, dataSize);
  }

  const result = new Uint8Array(totalCodewords);
  let index = 0;
  for (let i = 0; i < maxDataSize; i++)
    for (let r = 0; r < ecTotalBlocks; r++)
      if (i < dcData[r].length) result[index++] = dcData[r][i];
  for (let i = 0; i < ecCount; i++)
    for (let r = 0; r < ecTotalBlocks; r++)
      result[index++] = ecData[r][i];
  return result;
}

function createData(version: number, text: string): Uint8Array {
  const buffer = new BitBuffer();
  buffer.put(4, 4);
  const ccBits = getCharCountIndicator(version);
  buffer.put(text.length, ccBits);
  for (let i = 0; i < text.length; i++) buffer.put(text.charCodeAt(i), 8);

  const totalCodewords = getSymbolTotalCodewords(version);
  const ecTotal = getECCodewordsCount(version, 0);
  const dataTotalBits = (totalCodewords - ecTotal) * 8;

  if (buffer.getLengthInBits() + 4 <= dataTotalBits) buffer.put(0, 4);
  while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
  const remaining = (dataTotalBits - buffer.getLengthInBits()) / 8;
  for (let i = 0; i < remaining; i++) buffer.put(i % 2 ? 0x11 : 0xec, 8);

  return createCodewords(buffer, version, 0);
}

const MASKS: ((i: number, j: number) => boolean)[] = [
  (i, j) => (i + j) % 2 === 0,
  (i, j) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
  (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0,
  (i, j) => ((i * j) % 3 + (i + j) % 2) % 2 === 0,
];

function getPenalty(matrix: BitMatrix): number {
  const size = matrix.size;
  let points = 0;
  for (let r = 0; r < size; r++) {
    let sameCountCol = 0, sameCountRow = 0;
    let lastCol = -1, lastRow = -1;
    for (let c = 0; c < size; c++) {
      const m1 = matrix.get(r, c);
      if (m1 === lastCol) sameCountCol++;
      else { if (sameCountCol >= 5) points += 3 + (sameCountCol - 5); lastCol = m1; sameCountCol = 1; }
      const m2 = matrix.get(c, r);
      if (m2 === lastRow) sameCountRow++;
      else { if (sameCountRow >= 5) points += 3 + (sameCountRow - 5); lastRow = m2; sameCountRow = 1; }
    }
    if (sameCountCol >= 5) points += 3 + (sameCountCol - 5);
    if (sameCountRow >= 5) points += 3 + (sameCountRow - 5);
  }
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++) {
      const sum = matrix.get(r, c) + matrix.get(r + 1, c) + matrix.get(r, c + 1) + matrix.get(r + 1, c + 1);
      if (sum === 4 || sum === 0) points += 3;
    }
  for (let r = 0; r < size; r++) {
    let bitsCol = 0, bitsRow = 0;
    for (let c = 0; c < size; c++) {
      bitsCol = ((bitsCol << 1) & 0x7ff) | matrix.get(r, c);
      if (c >= 10 && (bitsCol === 0x5d0 || bitsCol === 0x05d)) points += 40;
      bitsRow = ((bitsRow << 1) & 0x7ff) | matrix.get(c, r);
      if (c >= 10 && (bitsRow === 0x5d0 || bitsRow === 0x05d)) points += 40;
    }
  }
  let darkCount = 0;
  matrix.forEach((_r, _c, v) => darkCount += v);
  const k = Math.abs(Math.ceil((darkCount * 100 / (size * size)) / 5) - 10);
  points += k * 10;
  return points;
}

function getVersion(text: string): number {
  const len = text.length + 3;
  for (let v = 1; v <= 10; v++) {
    const dataCodewords = getSymbolTotalCodewords(v) - getECCodewordsCount(v, 0);
    if (len <= dataCodewords) return v;
  }
  return 10;
}

const ALIGNMENT_POS = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

export function generateQRDataURL(text: string, moduleSize: number = 10): string {
  const version = getVersion(text);
  const size = getSymbolSize(version);
  const margin = 4;
  const totalModules = size + margin * 2;
  const pixels = totalModules * moduleSize;

  const matrix = new BitMatrix(size);
  setupFinderPattern(matrix);
  setupTimingPattern(matrix);
  setupAlignmentPattern(matrix, version);
  setupFormatInfo(matrix, 0, 0);

  const dataBits = createData(version, text);
  setupData(matrix, dataBits);

  let bestPattern = 0;
  let lowestPenalty = Infinity;
  for (let p = 0; p < 8; p++) {
    setupFormatInfo(matrix, 0, p);
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!matrix.isReserved(r, c)) matrix.xor(r, c, MASKS[p](r, c));
    const penalty = getPenalty(matrix);
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!matrix.isReserved(r, c)) matrix.xor(r, c, MASKS[p](r, c));
    if (penalty < lowestPenalty) { lowestPenalty = penalty; bestPattern = p; }
  }

  setupFormatInfo(matrix, 0, bestPattern);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!matrix.isReserved(r, c)) matrix.xor(r, c, MASKS[bestPattern](r, c));

  const canvas = document.createElement('canvas');
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pixels, pixels);
  ctx.fillStyle = '#000000';
  const offset = margin * moduleSize;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (matrix.get(r, c) === 1) ctx.fillRect(c * moduleSize + offset, r * moduleSize + offset, moduleSize, moduleSize);
  return canvas.toDataURL('image/png');
}
