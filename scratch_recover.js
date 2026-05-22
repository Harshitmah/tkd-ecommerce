const fs = require('fs');
const readline = require('readline');

async function recover() {
  const logPath = 'C:/Users/harsh/.gemini/antigravity-ide/brain/57329571-9213-437e-9bf9-3bfad7a5773e/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let part1 = '';
  let part2 = '';

  for await (const line of rl) {
    if (line.includes('view_file') && line.includes('page.tsx')) {
      const parsed = JSON.parse(line);
      if (parsed.content) {
        if (parsed.content.includes('Showing lines 1 to 800')) {
          part1 = parsed.content;
        } else if (parsed.content.includes('Showing lines 801 to 1121')) {
          part2 = parsed.content;
        }
      }
    }
  }

  function cleanContent(raw) {
    if (!raw) return '';
    // Extract the lines between "The following code has been modified..." and "The above content does NOT show..."
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
        // Remove line number e.g. "1: "
        const match = l.match(/^\\d+:\\s(.*)$/);
        if (match) {
          result.push(match[1]);
        } else {
          result.push(l); // fallback
        }
      }
    }
    return result.join('\\n');
  }

  const clean1 = cleanContent(part1);
  const clean2 = cleanContent(part2);
  
  const fullContent = clean1 + '\\n' + clean2;
  
  fs.writeFileSync('C:/Antigravity Project/tkd-ecommerce/app/(admin)/admin/workflows/create/page.tsx', fullContent, 'utf8');
  console.log('Recovery complete!');
}

recover();
