import fs from 'node:fs';

const file = process.argv[2];
const pattern = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
const fd = fs.openSync(file, 'r');
const head = Buffer.alloc(16);
fs.readSync(fd, head, 0, 16, 0);
// asar: UInt32 pickle size (4), UInt32 header size, then JSON header
const headerSize = head.readUInt32LE(12);
const buf = Buffer.alloc(headerSize);
fs.readSync(fd, buf, 0, headerSize, 16);
const header = JSON.parse(buf.toString('utf8'));

const results = [];
function walk(node, prefix) {
  if (!node) return;
  if (node.files) {
    for (const [name, child] of Object.entries(node.files)) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (child.files) walk(child, path);
      else if (!pattern || pattern.test(path)) results.push({ path, size: child.size });
    }
  }
}
walk(header, '');
console.log(results.length + ' matches');
for (const r of results.slice(0, Number(process.argv[4] ?? 400))) console.log(r.size.toString().padStart(9), r.path);
