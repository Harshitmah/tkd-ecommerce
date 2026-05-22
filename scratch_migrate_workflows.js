const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateData() {
  const DATA_DIR = path.join(process.cwd(), "data");
  const WORKFLOWS_FILE = path.join(DATA_DIR, "workflows.json");
  const LOGS_FILE = path.join(DATA_DIR, "workflow_logs.json");

  console.log("Starting migration to Supabase...");

  // 1. Migrate Workflows
  try {
    if (fs.existsSync(WORKFLOWS_FILE)) {
      const content = fs.readFileSync(WORKFLOWS_FILE, "utf-8");
      const workflows = JSON.parse(content);
      
      console.log(`Found ${workflows.length} workflows in JSON. Standardizing trigger names...`);

      const mappedWorkflows = workflows.map(w => {
        // Standardize trigger naming
        let newTrigger = w.trigger_type;
        if (newTrigger === 'ORDER_PLACED') newTrigger = 'order_created';
        if (newTrigger === 'REVIEW_RECEIVED') newTrigger = 'review_submitted';
        if (newTrigger === 'CUSTOMER_SIGNUP') newTrigger = 'customer_registered';

        // Update trigger nodes too
        const nodes = w.nodes.map(n => {
          if (n.type === 'trigger' && n.config) {
            if (n.config.triggerType === 'ORDER_PLACED') n.config.triggerType = 'order_created';
            if (n.config.triggerType === 'REVIEW_RECEIVED') n.config.triggerType = 'review_submitted';
            if (n.config.triggerType === 'CUSTOMER_SIGNUP') n.config.triggerType = 'customer_registered';
          }
          return n;
        });

        return {
          id: w.id,
          name: w.name,
          trigger_type: newTrigger,
          is_active: w.is_active,
          nodes: nodes,
          edges: w.edges,
          run_count: w.run_count || 0,
          created_at: w.created_at || new Date().toISOString(),
          updated_at: w.updated_at || new Date().toISOString()
        };
      });

      const { error } = await supabaseAdmin.from("workflows").upsert(mappedWorkflows);
      if (error) {
        console.error("Error inserting workflows:", error.message);
      } else {
        console.log(`Successfully migrated ${workflows.length} workflows to Supabase.`);
      }
    } else {
      console.log("No workflows.json found, skipping workflows migration.");
    }
  } catch (err) {
    console.error("Failed to migrate workflows:", err);
  }

  // 2. Migrate Logs
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const content = fs.readFileSync(LOGS_FILE, "utf-8");
      const logs = JSON.parse(content);
      
      console.log(`Found ${logs.length} logs in JSON.`);
      if (logs.length > 0) {
        const mappedLogs = logs.map(l => {
          let newTrigger = l.trigger_event;
          if (newTrigger === 'ORDER_PLACED') newTrigger = 'order_created';
          if (newTrigger === 'REVIEW_RECEIVED') newTrigger = 'review_submitted';
          if (newTrigger === 'CUSTOMER_SIGNUP') newTrigger = 'customer_registered';

          return {
            id: l.id,
            workflow_id: l.workflow_id,
            workflow_name: l.workflow_name,
            trigger_event: newTrigger,
            payload: l.payload,
            status: l.status,
            steps_executed: l.steps_executed,
            error_message: l.error_message,
            created_at: l.created_at || new Date().toISOString()
          };
        });

        const { error } = await supabaseAdmin.from("workflow_logs").upsert(mappedLogs);
        if (error) {
          console.error("Error inserting logs:", error.message);
        } else {
          console.log(`Successfully migrated ${logs.length} logs to Supabase.`);
        }
      }
    } else {
      console.log("No workflow_logs.json found, skipping logs migration.");
    }
  } catch (err) {
    console.error("Failed to migrate logs:", err);
  }

  console.log("Migration complete.");
}

migrateData();
