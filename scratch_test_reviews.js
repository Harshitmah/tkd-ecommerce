const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPublic() {
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(image_url),
      variants:product_variants(*, option_values:product_option_values(*)),
      reviews(rating, is_verified)
    `)
    .eq("status", "active")
    .limit(1);
    
  if (error) {
    console.error("Query failed:", error.message, error.details, error.hint, error.code);
  } else {
    console.log("Success");
  }
}

testPublic();
