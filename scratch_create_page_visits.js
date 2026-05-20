const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const {data, error} = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS page_visits (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Admins can view visits" ON page_visits;
      CREATE POLICY "Admins can view visits" ON page_visits FOR SELECT USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
      
      DROP POLICY IF EXISTS "Admins can delete visits" ON page_visits;
      CREATE POLICY "Admins can delete visits" ON page_visits FOR DELETE USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    `
  });
  console.log(error ? error.message : 'page_visits table created successfully!');
}
run();
