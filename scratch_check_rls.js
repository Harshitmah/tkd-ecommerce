const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking RLS on site_settings...");
  try {
    const { data: rlsStatus, error: err1 } = await supabase.rpc("exec_sql", { 
      sql: "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'site_settings';" 
    });
    if (err1) console.error("Error checking RLS:", err1);
    else console.log("RLS Status:", rlsStatus);

    const { data: policies, error: err2 } = await supabase.rpc("exec_sql", { 
      sql: "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'site_settings';" 
    });
    if (err2) console.error("Error checking policies:", err2);
    else console.log("Active pg_policies:", policies);
  } catch (err) {
    console.error("exec_sql exception:", err.message);
  }
}

check();
