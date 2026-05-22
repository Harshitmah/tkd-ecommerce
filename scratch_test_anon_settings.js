const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Fetching site settings with anonymous client...");
  try {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) {
      console.error("Error returned from Supabase:", error);
    } else {
      console.log("Success! Data:", data);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

test();
