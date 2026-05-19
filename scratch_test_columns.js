const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  console.log("Checking columns in product_variants table...");
  try {
    const { data: cols, error } = await supabase
      .from("product_variants")
      .select("*")
      .limit(1);
      
    if (error) {
      console.error("Error fetching product_variants:", error.message);
    } else {
      console.log("Keys in a product_variant record:", cols.length > 0 ? Object.keys(cols[0]) : "No records found");
    }
  } catch (err) {
    console.error("Exception checking columns:", err.message);
  }
}

checkColumns();
