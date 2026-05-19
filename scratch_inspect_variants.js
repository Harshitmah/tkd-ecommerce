const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log("Fetching products and their variants...");
  try {
    const { data: products, error: pError } = await supabase
      .from("products")
      .select("id, title, slug, status");
      
    if (pError) throw pError;
    
    console.log(`Found ${products.length} products:`);
    for (const p of products) {
      console.log(`\nProduct: ${p.title} (${p.slug}) [ID: ${p.id}, Status: ${p.status}]`);
      
      const { data: variants, error: vError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", p.id);
        
      if (vError) {
        console.error("  Error fetching variants:", vError.message);
      } else {
        console.log(`  Variants count: ${variants.length}`);
        variants.forEach(v => {
          console.log(`    - Variant: ${JSON.stringify(v)}`);
        });
      }
    }
  } catch (err) {
    console.error("Inspection error:", err.message);
  }
}

inspect();
