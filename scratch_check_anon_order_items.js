const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Testing as ANON user...");
  
  // Note: we aren't signed in, but we can see orders if they exist or sign in as one of the users
  // Let's first fetch all users to see if we can sign in, or just query order_items directly
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("*")
    .limit(5);
    
  if (error) {
    console.error("Error fetching order_items:", error.message);
  } else {
    console.log("Successfully fetched order_items as anon:", orderItems);
  }
}

test();
