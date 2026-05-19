const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSettings() {
  console.log("Fetching site settings...");
  try {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) {
      console.error("Error fetching site settings:", error.message);
    } else {
      console.log(`Found ${data.length} settings records:`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Inspection error:", err.message);
  }
}

inspectSettings();
