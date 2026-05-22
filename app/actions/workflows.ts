"use server"

import { nanoid } from "nanoid"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY || "mock_key")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WorkflowNode {
  id: string
  type: "trigger" | "condition" | "action"
  label: string
  config: {
    triggerType?: string // e.g. "ORDER_PLACED", "REVIEW_RECEIVED", etc.
    conditionField?: string // e.g. "total", "rating", "payment_method"
    conditionOperator?: "gte" | "lte" | "equals" | "contains"
    conditionValue?: string
    actionType?: "email" | "webhook" | "timeline" | "add_customer_tag" | "wait" | "add_to_google_sheet" | "sms"
    emailTo?: "customer" | "admin" | "custom" | string
    selectedAdmins?: string[]
    customEmailAddress?: string
    emailSubject?: string
    emailBody?: string
    webhookUrl?: string
    webhookPayload?: string
    timelineNote?: string
    delayMs?: number
    smsPhone?: string
    smsBody?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  conditionBranch?: "true" | "false" // For branching paths on conditions
}

export interface Workflow {
  id: string
  name: string
  trigger_type: string
  is_active: boolean
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  run_count: number
  created_at: string
  updated_at: string
}

export interface WorkflowLogStep {
  nodeId: string
  label: string
  type: string
  status: "success" | "failed" | "skipped"
  details: string
}

export interface WorkflowLog {
  id: string
  workflow_id: string
  workflow_name: string
  trigger_event: string
  payload: any
  status: "success" | "failed"
  steps_executed: WorkflowLogStep[]
  error_message?: string
  created_at: string
}

// READ Workflows
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

// Placeholder String Replacer Utility
function replacePlaceholders(str: string, payload: any): string {
  if (!str) return ""
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const orderId = payload?.id || payload?.order_id || ""
  const verifyUrl = `${siteUrl}/verify-order?id=${orderId}`
  
  const extendedPayload = {
    ...payload,
    verify_order_url: verifyUrl,
    verify_order_button: `<a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px; margin-bottom: 16px;">Confirm Order</a>`
  }

  return str.replace(/{([^{}]+)}/g, (match, key) => {
    const trimmedKey = key.trim()
    
    // Support nested paths (e.g. order.total)
    const parts = trimmedKey.split(".")
    let val = extendedPayload
    for (const part of parts) {
      if (val && typeof val === "object" && part in val) {
        val = val[part]
      } else {
        val = undefined
        break
      }
    }

    if (val !== undefined && val !== null) {
      return String(val)
    }
    
    // Direct matches in payload root
    if (trimmedKey in extendedPayload) {
      return String(extendedPayload[trimmedKey])
    }

    return match // Return original placeholder if not found
  })
}

// TRIGGER PIPELINE ENGINE
export async function triggerWorkflowEvent(eventType: string, payload: any) {
  const workflows = await getWorkflows()
  const activeFlows = workflows.filter((w) => w.trigger_type === eventType && w.is_active)

  if (activeFlows.length === 0) return

  for (const workflow of activeFlows) {
    // Increment run count
    workflow.run_count = (workflow.run_count || 0) + 1
    
    const traceSteps: WorkflowLogStep[] = []
    let status: "success" | "failed" = "success"
    let errorMessage: string | undefined = undefined

    try {
      // Logic traversal: Find trigger node
      const triggerNode = workflow.nodes.find((n) => n.type === "trigger")
      if (!triggerNode) {
        throw new Error("Trigger node not found in workflow definition.")
      }

      traceSteps.push({
        nodeId: triggerNode.id,
        label: triggerNode.label,
        type: "trigger",
        status: "success",
        details: `Trigger activated: ${eventType}`
      })

      // Walk nodes using edges
      let currentNodeId = triggerNode.id
      let conditionResultBranch: "true" | "false" | null = null

      while (true) {
        // Find outgoing edges from current node
        let edges = workflow.edges.filter((e) => e.source === currentNodeId)
        
        if (edges.length === 0) {
          // No more nodes to visit
          break
        }

        // If current node is a condition node, filter by branch result
        if (conditionResultBranch !== null) {
          const matchingEdge = edges.find((e) => e.conditionBranch === conditionResultBranch)
          if (!matchingEdge) {
            // No matching path for condition branch, stop workflow
            traceSteps.push({
              nodeId: currentNodeId,
              label: "End Branch",
              type: "path_end",
              status: "skipped",
              details: `Workflow execution ended. No matching edges for branch: ${conditionResultBranch}`
            })
            break
          }
          edges = [matchingEdge]
          conditionResultBranch = null // Reset
        }

        // We assume single output path for simple sequential action nodes
        const edge = edges[0]
        const nextNode = workflow.nodes.find((n) => n.id === edge.target)

        if (!nextNode) {
          break
        }

        currentNodeId = nextNode.id

        if (nextNode.type === "condition") {
          // Evaluate condition node
          const field = nextNode.config.conditionField || ""
          let operator = nextNode.config.conditionOperator || "equals"

          // Force equals for text fields to prevent NaN math errors
          if (field === "payment_method" || field === "payment_status") {
            operator = "equals"
          }
          const valTarget = nextNode.config.conditionValue || ""

          // Extract value from payload (supports direct or nested paths)
          const parts = field.split(".")
          let valActual: any = payload
          for (const part of parts) {
            if (valActual && typeof valActual === "object" && part in valActual) {
              valActual = valActual[part]
            } else {
              valActual = undefined
              break
            }
          }

          if (valActual === undefined && field in payload) {
            valActual = payload[field]
          }

          let matched = false
          const numActual = Number(valActual)
          const numTarget = Number(valTarget)

          if (operator === "gte") {
            matched = !isNaN(numActual) && !isNaN(numTarget) && numActual >= numTarget
          } else if (operator === "lte") {
            matched = !isNaN(numActual) && !isNaN(numTarget) && numActual <= numTarget
          } else if (operator === "equals") {
            matched = String(valActual).toLowerCase() === String(valTarget).toLowerCase()
          } else if (operator === "contains") {
            matched = String(valActual).toLowerCase().includes(String(valTarget).toLowerCase())
          }

          conditionResultBranch = matched ? "true" : "false"

          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "condition",
            status: "success",
            details: `Condition checked: Field "${field}" (${valActual}) ${operator} "${valTarget}" -> Result: ${conditionResultBranch.toUpperCase()}`
          })

        } else if (nextNode.type === "action") {
          // Execute action node
          const actionType = nextNode.config.actionType
          
          if (actionType === "email") {
            const to = nextNode.config.emailTo || "customer"
            let destinations: string[] = []
            if (to === "customer") {
              const email = payload.email || payload.customer_email || "Customer Recipient"
              destinations = [email]
            } else if (to === "admin") {
              const selectedAdmins = nextNode.config.selectedAdmins || []
              if (selectedAdmins.length > 0) {
                destinations = selectedAdmins
              } else {
                // Dynamically fetch all admin emails from the database
                const { data: admins } = await supabaseAdmin
                  .from('profiles')
                  .select('email')
                  .eq('role', 'admin')
                  
                if (admins && admins.length > 0) {
                  destinations = admins.map(a => a.email).filter(Boolean) as string[]
                } else {
                  destinations = ["admin@telkidukan.com"] // Global fallback if database has 0 admins
                }
              }
            } else if (to === "custom") {
              destinations = [nextNode.config.customEmailAddress || "custom@example.com"]
            }

            const subject = replacePlaceholders(nextNode.config.emailSubject || "", payload)
            const body = replacePlaceholders(nextNode.config.emailBody || "", payload)

            let emailDetails = ""
            if (process.env.RESEND_API_KEY) {
              try {
                const { data, error } = await resend.emails.send({
                  from: "TelkiDukan Automation <onboarding@resend.dev>", // default test domain
                  to: destinations,
                  subject: subject,
                  html: body.replace(/\n/g, "<br/>")
                })
                
                if (error) {
                  emailDetails = `Resend API Error: ${error.message} (Note: Free tier only allows sending to your verified email address)`
                  console.error("[Resend API Error]", error)
                } else {
                  emailDetails = `Successfully sent email via Resend to ${destinations.join(", ")}.\nSubject: ${subject}`
                  console.log(`[Resend Email] Delivered to: ${destinations.join(", ")}`)
                }
              } catch (emailErr: any) {
                emailDetails = `Failed to send email to ${destinations.join(", ")}: ${emailErr.message}`
                console.error("[Resend Error]", emailErr)
              }
            } else {
              // Dynamic mock sending simulation
              const destStr = destinations.join(", ")
              console.log(`[Automation Email Send (MOCKED)] To: ${destStr} | Subject: "${subject}"`)
              emailDetails = `MOCKED email sent to ${destStr} (Missing RESEND_API_KEY).\nSubject: ${subject}\nBody preview: ${body.substring(0, 100)}...`
            }

            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: emailDetails
            })

          } else if (actionType === "webhook") {
            const url = nextNode.config.webhookUrl || ""
            let rawPayload = nextNode.config.webhookPayload || "{}"
            const parsedPayload = replacePlaceholders(rawPayload, payload)

            let fetchDetails = ""
            try {
              if (url) {
                // Fire real outbound HTTP webhook POST call
                const response = await fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: parsedPayload
                })
                fetchDetails = `Webhook URL: POST ${url} -> Status: ${response.status} ${response.statusText}`
              } else {
                fetchDetails = `Webhook URL missing. Simulated payload: ${parsedPayload}`
              }
            } catch (fetchErr: any) {
              fetchDetails = `Webhook URL: POST ${url} -> Network Error: ${fetchErr.message}`
            }

            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: fetchDetails
            })

          } else if (actionType === "timeline") {
            const note = replacePlaceholders(nextNode.config.timelineNote || "", payload)
            
            // Simulates creating order comments / log updates
            console.log(`[Automation Timeline Log] Order Note: "${note}"`)

            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: `Timeline note added: "${note}"`
            })
          } else if (actionType === "add_customer_tag") {
            const tag = replacePlaceholders(nextNode.config.timelineNote || "", payload)
            console.log(`[Automation Customer Tag] Tag added: "${tag}"`)

            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: `Customer tag added: "${tag}"`
            })
          } else if (actionType === "wait") {
            const delayMs = Number(nextNode.config.delayMs) || 5000
            console.log(`[Automation Wait] Pausing for ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: `Execution paused for ${delayMs}ms.`
            })
          } else if (actionType === "add_to_google_sheet") {
            const url = nextNode.config.webhookUrl || ""
            let rawPayload = nextNode.config.webhookPayload || "{}"
            const parsedPayload = replacePlaceholders(rawPayload, payload)

            let sheetDetails = ""
            try {
              if (url) {
                const response = await fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: parsedPayload
                })
                sheetDetails = `Google Sheets Appended via Webhook -> Status: ${response.status}`
              } else {
                sheetDetails = `Missing Google Sheets Webhook URL.`
              }
            } catch (err: any) {
              sheetDetails = `Google Sheets Error: ${err.message}`
            }

            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: sheetDetails
            })
          } else if (actionType === "sms") {
            const phone = replacePlaceholders(nextNode.config.smsPhone || "", payload)
            const body = replacePlaceholders(nextNode.config.smsBody || "", payload)

            // MOCKED SMS dispatch
            console.log(`[Automation SMS (MOCKED)] To: ${phone} | Body: "${body}"`)
            
            traceSteps.push({
              nodeId: nextNode.id,
              label: nextNode.label,
              type: "action",
              status: "success",
              details: `MOCKED SMS sent to ${phone}.\nMessage: ${body}`
            })
          }
        }
      }

    } catch (err: any) {
      status = "failed"
      errorMessage = err.message
      traceSteps.push({
        nodeId: "error-node",
        label: "System Exception",
        type: "error",
        status: "failed",
        details: err.message
      })
    }

    // Add entry to execution database
    const log: WorkflowLog = {
      id: nanoid(),
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      trigger_event: eventType,
      payload,
      status,
      steps_executed: traceSteps,
      error_message: errorMessage,
      created_at: new Date().toISOString()
    }

    await addWorkflowLog(log)
  }

  // Persist the updated run_counts
  await saveWorkflows(workflows)
}

// LIVE PATH TRACER SIMULATOR FOR frontend visual designer
export async function simulateWorkflowExecution(workflow: Workflow, payload: any): Promise<WorkflowLogStep[]> {
  const traceSteps: WorkflowLogStep[] = []

  try {
    const triggerNode = workflow.nodes.find((n) => n.type === "trigger")
    if (!triggerNode) {
      throw new Error("Trigger node not found in workflow.")
    }

    traceSteps.push({
      nodeId: triggerNode.id,
      label: triggerNode.label,
      type: "trigger",
      status: "success",
      details: "Simulator: Trigger node passed."
    })

    let currentNodeId = triggerNode.id
    let conditionResultBranch: "true" | "false" | null = null

    while (true) {
      let edges = workflow.edges.filter((e) => e.source === currentNodeId)
      if (edges.length === 0) break

      if (conditionResultBranch !== null) {
        const matchingEdge = edges.find((e) => e.conditionBranch === conditionResultBranch)
        if (!matchingEdge) {
          traceSteps.push({
            nodeId: currentNodeId,
            label: "End Branch",
            type: "path_end",
            status: "skipped",
            details: `Simulator: Flow ends because Condition was ${conditionResultBranch.toUpperCase()}`
          })
          break
        }
        edges = [matchingEdge]
        conditionResultBranch = null
      }

      const edge = edges[0]
      const nextNode = workflow.nodes.find((n) => n.id === edge.target)
      if (!nextNode) break

      currentNodeId = nextNode.id

      if (nextNode.type === "condition") {
        const field = nextNode.config.conditionField || ""
        let operator = nextNode.config.conditionOperator || "equals"

        if (field === "payment_method" || field === "payment_status") {
          operator = "equals"
        }
        const valTarget = nextNode.config.conditionValue || ""

        const parts = field.split(".")
        let valActual: any = payload
        for (const part of parts) {
          if (valActual && typeof valActual === "object" && part in valActual) {
            valActual = valActual[part]
          } else {
            valActual = undefined
            break
          }
        }

        if (valActual === undefined && field in payload) {
          valActual = payload[field]
        }

        let matched = false
        const numActual = Number(valActual)
        const numTarget = Number(valTarget)

        if (operator === "gte") {
          matched = !isNaN(numActual) && !isNaN(numTarget) && numActual >= numTarget
        } else if (operator === "lte") {
          matched = !isNaN(numActual) && !isNaN(numTarget) && numActual <= numTarget
        } else if (operator === "equals") {
          matched = String(valActual).toLowerCase() === String(valTarget).toLowerCase()
        } else if (operator === "contains") {
          matched = String(valActual).toLowerCase().includes(String(valTarget).toLowerCase())
        }

        conditionResultBranch = matched ? "true" : "false"

        traceSteps.push({
          nodeId: nextNode.id,
          label: nextNode.label,
          type: "condition",
          status: "success",
          details: `Simulator Condition: "${field}" (${valActual}) ${operator} "${valTarget}" evaluates to ${conditionResultBranch.toUpperCase()}`
        })

      } else if (nextNode.type === "action") {
        const actionType = nextNode.config.actionType
        if (actionType === "email") {
          const to = nextNode.config.emailTo || "customer"
          let destination = to
          if (to === "customer") {
            destination = payload.email || payload.customer_email || "customer@example.com"
          } else if (to === "admin") {
            const selectedAdmins = nextNode.config.selectedAdmins || []
            destination = selectedAdmins.length > 0 ? selectedAdmins.join(", ") : "All Admins"
          } else if (to === "custom") {
            destination = nextNode.config.customEmailAddress || "custom@example.com"
          }
          const subject = replacePlaceholders(nextNode.config.emailSubject || "", payload)
          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "action",
            status: "success",
            details: `Simulator Email Action: Would send email to ${destination}.\nSubject: ${subject}`
          })
        } else if (actionType === "webhook") {
          const url = nextNode.config.webhookUrl || ""
          const previewBody = replacePlaceholders(nextNode.config.webhookPayload || "{}", payload)
          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "action",
            status: "success",
            details: `Simulator Webhook: Would POST to ${url}\nPayload: ${previewBody}`
          })
        } else if (actionType === "wait") {
          const delayMs = Number(nextNode.config.delayMs) || 5000
          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "action",
            status: "success",
            details: `Simulator Wait: Would pause execution for ${delayMs}ms.`
          })
        } else if (actionType === "add_to_google_sheet") {
          const url = nextNode.config.webhookUrl || ""
          const previewBody = replacePlaceholders(nextNode.config.webhookPayload || "{}", payload)
          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "action",
            status: "success",
            details: `Simulator Google Sheets: Would POST to ${url}\nPayload: ${previewBody}`
          })
        } else if (actionType === "sms") {
          const phone = replacePlaceholders(nextNode.config.smsPhone || "", payload)
          const body = replacePlaceholders(nextNode.config.smsBody || "", payload)
          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "action",
            status: "success",
            details: `Simulator SMS: Would send message to ${phone}.\nMessage: ${body}`
          })
        } else if (actionType === "timeline" || actionType === "add_customer_tag") {
          const txt = replacePlaceholders(nextNode.config.timelineNote || "", payload)
          traceSteps.push({
            nodeId: nextNode.id,
            label: nextNode.label,
            type: "action",
            status: "success",
            details: `Simulator ${actionType}: "${txt}"`
          })
        }
      }
    }
  } catch (err: any) {
    traceSteps.push({
      nodeId: "error-node",
      label: "Simulator Error",
      type: "error",
      status: "failed",
      details: err.message
    })
  }

  return traceSteps
}
