const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking RLS on order_items...");
  try {
    const { data, error } = await supabase.rpc("exec_sql", { 
      sql: "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'order_items';" 
    });
    if (error) {
      console.log("RPC exec_sql error:", error.message);
    } else {
      console.log("RLS Status:", data);
    }
  } catch (err) {
    console.error("exec_sql exception:", err.message);
  }
}

check();
