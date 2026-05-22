const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', 'actions', 'workflows.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace imports
content = content.replace(
`import * as fs from "fs/promises"
import * as path from "path"
import { nanoid } from "nanoid"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "mock_key")


const DATA_DIR = path.join(process.cwd(), "data")
const WORKFLOWS_FILE = path.join(DATA_DIR, "workflows.json")
const LOGS_FILE = path.join(DATA_DIR, "workflow_logs.json")`,
`import { nanoid } from "nanoid"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY || "mock_key")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)`);

// 2. Replace DB operations (from ensureDataFiles to clearWorkflowLogs)
const startIndex = content.indexOf('// Ensure data directory and files exist');
const endIndex = content.indexOf('// Placeholder String Replacer Utility');

const newDbLogic = `// READ Workflows
export async function getWorkflows(): Promise<Workflow[]> {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error reading workflows:", error)
    return []
  }
  return data as Workflow[]
}

// SAVE/UPDATE Workflows
export async function saveWorkflows(workflows: Workflow[]): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("workflows")
    .upsert(
      workflows.map(w => ({
        id: w.id,
        name: w.name,
        trigger_type: w.trigger_type,
        is_active: w.is_active,
        nodes: w.nodes,
        edges: w.edges,
        run_count: w.run_count,
        updated_at: new Date().toISOString()
      }))
    )

  if (error) {
    console.error("Error saving multiple workflows:", error)
    return false
  }
  return true
}

// SAVE SINGLE Workflow
export async function upsertWorkflow(workflow: Workflow): Promise<boolean> {
  const isNew = !workflow.id || workflow.id.length < 10
  const id = isNew ? nanoid() : workflow.id
  
  const payload = {
    id,
    name: workflow.name,
    trigger_type: workflow.trigger_type,
    is_active: workflow.is_active,
    nodes: workflow.nodes,
    edges: workflow.edges,
    run_count: workflow.run_count || 0,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from("workflows")
    .upsert(payload)

  if (error) {
    console.error("Error upserting workflow:", error)
    return false
  }
  return true
}

// DELETE Workflow
export async function deleteWorkflow(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("workflows")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting workflow:", error)
    return false
  }
  return true
}

// READ Logs
export async function getWorkflowLogs(): Promise<WorkflowLog[]> {
  const { data, error } = await supabaseAdmin
    .from("workflow_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error reading logs:", error)
    return []
  }
  return data as WorkflowLog[]
}

// WRITE LOG Entry
async function addWorkflowLog(log: WorkflowLog) {
  const { error } = await supabaseAdmin
    .from("workflow_logs")
    .insert({
      id: log.id,
      workflow_id: log.workflow_id,
      workflow_name: log.workflow_name,
      trigger_event: log.trigger_event,
      payload: log.payload,
      status: log.status,
      steps_executed: log.steps_executed,
      error_message: log.error_message
    })

  if (error) {
    console.error("Error saving workflow log:", error)
  }
}

// CLEAR LOGS
export async function clearWorkflowLogs(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("workflow_logs")
    .delete()
    .neq("id", "dummy")

  if (error) {
    console.error("Error clearing logs:", error)
    return false
  }
  return true
}

`;

content = content.substring(0, startIndex) + newDbLogic + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log('workflows.ts updated successfully.');
