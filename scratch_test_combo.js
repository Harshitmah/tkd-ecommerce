const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('combo_offers').insert([
    { name: 'Test Combo', buy_quantity: 2, get_quantity: 2, is_active: true }
  ]).select();

  console.log("Error:", error);
  console.log("Data:", data);
}
run();
