const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'C:\\Antigravity Project\\tkd-ecommerce\\.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars. URL:", supabaseUrl, "Key:", supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, full_name');
    
  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }
  
  console.log("Total profiles:", profiles.length);
  console.log("Profiles list:");
  profiles.forEach(p => {
    console.log(`- ID: ${p.id}, Email: ${p.email}, Role: ${p.role}, Name: ${p.full_name}`);
  });
}

run();
