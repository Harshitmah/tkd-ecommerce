const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Querying reviews table...");
  try {
    const { data, error } = await supabase.from("reviews").select("*");
    if (error) {
      console.log("Error querying reviews:", error.message);
    } else {
      console.log(`Success! Found ${data.length} reviews:`, data);
    }
  } catch (err) {
    console.error("Exception:", err.message);
  }
}

check();
