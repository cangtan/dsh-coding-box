import fs from 'node:fs';

// Usage:
//   node asar-read.mjs <asar> list <regex> [limit]
//   node asar-read.mjs <asar> extract <innerPath> <outFile>
//   node asar-read.mjs <asar> grep <regex> [fileRegex] [contextChars]

const [asar, mode, ...rest] = process.argv.slice(2);
const fd = fs.openSync(asar, 'r');
const head = Buffer.alloc(16);
fs.readSync(fd, head, 0, 16, 0);
const headerSize = head.readUInt32LE(12);
const headerBuf = Buffer.alloc(headerSize);
fs.readSync(fd, headerBuf, 0, headerSize, 16);
const header = JSON.parse(headerBuf.toString('utf8'));
const base = 16 + headerSize;

const entries = [];
function walk(node, prefix) {
  if (!node?.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const p = prefix ? `${prefix}/${name}` : name;
    if (child.files) walk(child, p);
    else entries.push({ path: p, offset: child.offset, size: child.size });
  }
}
walk(header, '');

if (mode === 'list') {
  const re = new RegExp(rest[0], 'i');
  const limit = Number(rest[1] ?? 200);
  const hits = entries.filter((e) => re.test(e.path));
  console.log(`${hits.length} matches`);
  for (const h of hits.slice(0, limit)) console.log(String(h.size).padStart(9), h.path);
} else if (mode === 'extract') {
  const e = entries.find((x) => x.path === rest[0]);
  if (!e) throw new Error(`not found: ${rest[0]}`);
  const buf = Buffer.alloc(e.size);
  fs.readSync(fd, buf, 0, e.size, base + Number(e.offset));
  fs.mkdirSync(rest[1].replace(/[\\/][^\\/]+$/, ''), { recursive: true });
  fs.writeFileSync(rest[1], buf);
  console.log(`extracted ${e.size} bytes -> ${rest[1]}`);
} else if (mode === 'grep') {
  const re = new RegExp(rest[0], 'i');
  const fileRe = rest[1] ? new RegExp(rest[1], 'i') : /\.js$/i;
  const ctx = Number(rest[2] ?? 120);
  let count = 0;
  for (const e of entries) {
    if (!fileRe.test(e.path) || e.size > 4_000_000 || e.offset === undefined || !Number.isFinite(Number(e.offset))) continue;
    const buf = Buffer.alloc(e.size);
    fs.readSync(fd, buf, 0, e.size, base + Number(e.offset));
    const text = buf.toString('utf8');
    let m;
    const rx = new RegExp(re.source, 'gi');
    let printed = 0;
    while ((m = rx.exec(text)) !== null && printed < 6) {
      printed++;
      const start = Math.max(0, m.index - ctx);
      const end = Math.min(text.length, m.index + m[0].length + ctx);
      console.log(`\n--- ${e.path} @${m.index}\n${text.slice(start, end).replace(/\n/g, ' ')}`);
    }
    count += printed;
    if (count > 60) break;
  }
  console.log(`\n${count} matches`);
}
