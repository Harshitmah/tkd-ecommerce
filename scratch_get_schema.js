const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  try {
    const res = await fetch(url);
    const schema = await res.json();
    console.log("Tables:", Object.keys(schema.paths).filter(p => !p.startsWith('/rpc/')));
    console.log("RPCs:", Object.keys(schema.paths).filter(p => p.startsWith('/rpc/')));
  } catch (err) {
    console.error("Error fetching schema:", err.message);
  }
}
run();
