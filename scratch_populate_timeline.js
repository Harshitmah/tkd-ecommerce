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
  // Clear existing order_timeline records to start clean
  await supabase.from('order_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, user_id, fulfillment_status, created_at, updated_at')
    .order('created_at');
    
  if (error) {
    console.error("Error fetching orders:", error);
    process.exit(1);
  }
  
  console.log(`Backfilling timeline for ${orders.length} orders...`);
  
  for (const order of orders) {
    const timelineEvents = [];
    const baseTime = new Date(order.created_at);
    
    // 1. Placed event
    timelineEvents.push({
      order_id: order.id,
      status: 'pending',
      note: 'Order placed successfully.',
      created_by: order.user_id || null,
      created_at: baseTime.toISOString()
    });
    
    const status = order.fulfillment_status?.toLowerCase();
    
    if (status === 'processing' || status === 'shipped' || status === 'delivered' || status === 'completed') {
      const procTime = new Date(baseTime.getTime() + 60 * 60 * 1000); // +1 hour
      timelineEvents.push({
        order_id: order.id,
        status: 'processing',
        note: 'Your order is being packed and prepared for shipment.',
        created_by: null,
        created_at: procTime.toISOString()
      });
    }
    
    if (status === 'shipped' || status === 'delivered' || status === 'completed') {
      const shipTime = new Date(baseTime.getTime() + 4 * 60 * 60 * 1000); // +4 hours
      timelineEvents.push({
        order_id: order.id,
        status: 'shipped',
        note: 'Your order has been shipped and is in transit.',
        created_by: null,
        created_at: shipTime.toISOString()
      });
    }
    
    if (status === 'delivered' || status === 'completed') {
      const delTime = new Date(order.updated_at);
      timelineEvents.push({
        order_id: order.id,
        status: 'delivered',
        note: 'Your order has been successfully delivered!',
        created_by: null,
        created_at: delTime.toISOString()
      });
    }
    
    if (status === 'cancelled') {
      const cancelTime = new Date(order.updated_at);
      timelineEvents.push({
        order_id: order.id,
        status: 'cancelled',
        note: 'Your order was cancelled.',
        created_by: null,
        created_at: cancelTime.toISOString()
      });
    }
    
    const { error: insError } = await supabase.from('order_timeline').insert(timelineEvents);
    if (insError) {
      console.error(`Error inserting timeline for order ${order.id}:`, insError);
    } else {
      console.log(`- Created ${timelineEvents.length} timeline events for order #${order.id.slice(0,8)} (${order.fulfillment_status})`);
    }
  }
  
  console.log("Timeline backfill completed!");
}

run();
