const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePhone() {
  console.log("Updating contact_phone in site_settings...");
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .update({ contact_phone: "+91 9045024365" })
      .eq("site_name", "TELKIDUKAN")
      .select();

    if (error) {
      console.error("Error updating phone:", error.message);
    } else {
      console.log("Successfully updated settings:", data);
    }
  } catch (err) {
    console.error("Update error:", err.message);
  }
}

updatePhone();
