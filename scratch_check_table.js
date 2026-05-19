const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Testing RPC exec_sql...");
  try {
    const { data, error } = await supabase.rpc("exec_sql", { sql: "SELECT 1;" });
    if (error) {
      console.log("RPC exec_sql error:", error.message);
    } else {
      console.log("exec_sql works! data:", data);
    }
  } catch (err) {
    console.error("exec_sql exception:", err.message);
  }
}

check();
