const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  try {
    const res = await fetch(url);
    const schema = await res.json();
    console.log("Blogs table path definition:", schema.paths['/blogs']);
    console.log("Blogs table definition in definitions:", schema.definitions['blogs']);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
