const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const {data, error} = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public read access" ON product_variants;
      DROP POLICY IF EXISTS "Allow all for auth users" ON product_variants;
      CREATE POLICY "Allow public read access" ON product_variants FOR SELECT USING (true);
      CREATE POLICY "Allow all for auth users" ON product_variants FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
      
      ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public read access" ON product_images;
      DROP POLICY IF EXISTS "Allow all for auth users" ON product_images;
      CREATE POLICY "Allow public read access" ON product_images FOR SELECT USING (true);
      CREATE POLICY "Allow all for auth users" ON product_images FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    `
  });
  console.log(error ? error.message : 'RLS policies created successfully!');
}
run();
