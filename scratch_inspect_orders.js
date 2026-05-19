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
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, user_id, shipping_address, total, created_at');
    
  if (error) {
    console.error("Error fetching orders:", error);
    process.exit(1);
  }
  
  console.log("Total orders:", orders.length);
  orders.forEach((o, index) => {
    console.log(`Order ${index + 1}:`);
    console.log(`- ID: ${o.id}`);
    console.log(`- User ID: ${o.user_id}`);
    console.log(`- Shipping Address:`, o.shipping_address);
    console.log(`- Total: ${o.total}`);
    console.log(`- Created At: ${o.created_at}`);
  });
}

run();
