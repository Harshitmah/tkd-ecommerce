const fs = require('fs');

function extract(filePath) {
  const line = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(line);
  if (!parsed.content) return '';

  const raw = parsed.content;
  const lines = raw.split('\\n');
  const result = [];
  let capture = false;
  for (const l of lines) {
    if (l.includes('The following code has been modified')) {
      capture = true;
      continue;
    }
    if (l.includes('The above content does NOT show') || l.includes('The above content shows')) {
      capture = false;
      continue;
    }
    if (capture) {
      const match = l.match(/^\\d+:\\s(.*)$/);
      if (match) {
        result.push(match[1]);
      } else {
        result.push(l);
      }
    }
  }
  return result.join('\\n');
}

const clean1 = extract('scratch_log_part2.txt');
const clean2 = extract('scratch_log_part3.txt');

const fullContent = clean1 + '\\n' + clean2;
fs.writeFileSync('C:/Antigravity Project/tkd-ecommerce/app/(admin)/admin/workflows/create/page.tsx', fullContent, 'utf8');
console.log('Recovery complete, file rewritten!');
