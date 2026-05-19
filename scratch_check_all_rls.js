const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  console.log("Checking RLS policies for product_variants...");
  try {
    const { data: rlsStatus, error: rlsErr } = await supabase.rpc("exec_sql", { 
      sql: "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'product_variants';" 
    });
    if (rlsErr) {
      console.log("Error checking relrowsecurity:", rlsErr.message);
    } else {
      console.log("RLS Status on product_variants:", rlsStatus);
    }

    const { data: policies, error: polErr } = await supabase.rpc("exec_sql", { 
      sql: "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'product_variants';" 
    });
    if (polErr) {
      console.log("Error fetching pg_policies:", polErr.message);
    } else {
      console.log("Active pg_policies:", policies);
    }
  } catch (err) {
    console.error("Exception checking RLS:", err.message);
  }
}

checkRLS();
