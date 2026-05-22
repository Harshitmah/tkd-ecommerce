const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Executing migration via Supabase exec_sql RPC...");
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- 1. Create workflows table
      CREATE TABLE IF NOT EXISTS workflows (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          trigger_type TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          nodes JSONB NOT NULL,
          run_count INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS on workflows
      ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

      -- Admins can do anything on workflows
      DROP POLICY IF EXISTS "Admins can manage workflows" ON workflows;
      CREATE POLICY "Admins can manage workflows" ON workflows FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      ) WITH CHECK (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );

      -- 2. Create workflow_logs table
      CREATE TABLE IF NOT EXISTS workflow_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
          trigger_event TEXT NOT NULL,
          payload JSONB NOT NULL,
          status TEXT NOT NULL,
          steps_executed JSONB NOT NULL,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS on workflow_logs
      ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

      -- Admins can manage workflow_logs
      DROP POLICY IF EXISTS "Admins can manage workflow_logs" ON workflow_logs;
      CREATE POLICY "Admins can manage workflow_logs" ON workflow_logs FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      ) WITH CHECK (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    `
  });

  if (error) {
    console.error("Migration error:", error.message);
  } else {
    console.log("workflows and workflow_logs tables created and secured successfully!");
  }
}

run();
