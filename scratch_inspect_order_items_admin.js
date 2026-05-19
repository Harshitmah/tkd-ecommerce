const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Testing as service_role...");
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("*");
    
  if (error) {
    console.error("Error fetching order_items:", error.message);
  } else {
    console.log("Total order_items in DB:", orderItems.length);
    console.log("Sample order_items:", orderItems.slice(0, 5));
  }
}

test();
