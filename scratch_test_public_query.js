const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Initialize public anon client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPublic() {
  console.log("Simulating a public user query...");
  try {
    const slug = "black-sesame-oil";
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name, slug),
        images:product_images(image_url, alt_text),
        options:product_options(
          id,
          name,
          values:product_option_values(id, value)
        ),
        variants:product_variants(*)
      `)
      .eq("slug", slug)
      .single();
      
    if (error) {
      console.error("Query failed:", error.message);
    } else {
      console.log("Successfully fetched product:", product.title);
      console.log("Images:", product.images);
      console.log("Options:", product.options);
      console.log("Variants:", product.variants);
    }
  } catch (err) {
    console.error("Exception during public query:", err.message);
  }
}

testPublic();
