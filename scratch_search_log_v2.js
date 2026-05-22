const fs = require('fs');
const readline = require('readline');

async function searchLog() {
  const logPath = 'C:/Users/harsh/.gemini/antigravity-ide/brain/57329571-9213-437e-9bf9-3bfad7a5773e/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let found = 0;
  for await (const line of rl) {
    if (line.includes('app/%28admin%29/admin/workflows/create/page.tsx')) {
      found++;
      if (line.length > 10000) {
         console.log('Found massive match! Length:', line.length);
         fs.writeFileSync(`scratch_log_part_large_${found}.txt`, line, 'utf8');
      }
    }
  }
  console.log('Total matches found:', found);
}

searchLog();
