"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { 
  getWorkflows, 
  upsertWorkflow, 
  simulateWorkflowExecution,
  Workflow, 
  WorkflowNode, 
  WorkflowEdge,
  WorkflowLogStep
} from "@/app/actions/workflows"
import { createClient } from "@/lib/supabase/client"
import { 
  GitBranch, 
  ChevronLeft, 
  Save, 
  Play, 
  Plus, 
  Trash2, 
  Settings, 
  Database,
  Mail,
  Globe,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  CheckCircle,
  PlayCircle,
  X
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const TRIGGER_TYPES = [
  { id: "ORDER_PLACED", label: "When Order is Placed" },
  { id: "REVIEW_RECEIVED", label: "When Review is Submitted" },
  { id: "CUSTOMER_SIGNUP", label: "When Customer Signs Up" },
  { id: "ORDER_CANCELLED", label: "When Order is Cancelled" },
  { id: "CART_ABANDONED", label: "When Cart is Abandoned" },
  { id: "payment_success", label: "When Payment Succeeds" },
  { id: "payment_failed", label: "When Payment Fails" }
]

const CONDITION_FIELDS = {
  "ORDER_PLACED": [
    { id: "total", label: "Order Total (₹)" },
    { id: "payment_method", label: "Payment Method" },
    { id: "payment_status", label: "Payment Status" },
    { id: "coupon_code", label: "Coupon Code Used" },
    { id: "order_status", label: "Order Status" },
    { id: "items_count", label: "Number of Items" },
    { id: "shipping_city", label: "Shipping City" }
  ],
  "REVIEW_RECEIVED": [
    { id: "rating", label: "Star Rating (1-5)" },
    { id: "review_text", label: "Review Content Text" }
  ],
  "CUSTOMER_SIGNUP": [
    { id: "email", label: "Customer Email Address" },
    { id: "phone", label: "Customer Phone" },
    { id: "city", label: "Customer City" }
  ],
  "ORDER_CANCELLED": [
    { id: "total", label: "Order Total (₹)" },
    { id: "order_status", label: "Order Status" }
  ],
  "CART_ABANDONED": [
    { id: "total", label: "Cart Total (₹)" },
    { id: "items_count", label: "Number of Items" }
  ],
  "payment_success": [
    { id: "total", label: "Payment Total (₹)" },
    { id: "payment_method", label: "Payment Method" }
  ],
  "payment_failed": [
    { id: "total", label: "Payment Total (₹)" },
    { id: "payment_method", label: "Payment Method" }
  ]
}

const TEMPLATE_PAYLOADS = {
  "ORDER_PLACED": [
    {
      name: "VIP Premium Order",
      payload: {
        id: "ord-mock-vip",
        order_number: "ORD-99501",
        email: "priya.sharma@vip.com",
        customer_name: "Priya Sharma",
        customer_address: "45 Lotus Apartments, Bandra West, Mumbai, MH - 400050",
        total: 6250,
        order_total: "₹6,250",
        payment_method: "Online",
        coupon_code: "PREMIUM10",
        products_list: "Organic Cold Pressed Almond Oil (x3), Rose Water (x1)"
      }
    },
    {
      name: "COD Budget Order",
      payload: {
        id: "ord-mock-cod",
        order_number: "ORD-11204",
        email: "rahul.v@gmail.com",
        customer_name: "Rahul Verma",
        customer_address: "12 Main Street, Sector 4, Noida, UP - 201301",
        total: 1200,
        order_total: "₹1,200",
        payment_method: "COD",
        coupon_code: "None",
        products_list: "Organic Mustard Seed Oil (x1)"
      }
    }
  ],
  "REVIEW_RECEIVED": [
    {
      name: "Negative Review (1-Star)",
      payload: {
        id: "rev-mock-neg",
        rating: 1,
        title: "Disappointed",
        review_text: "The seal of the bottle was broken and it leaked in the transit box. Very bad experience.",
        product_title: "Pure Walnut Hair Oil",
        customer_name: "Anil Kapoor",
        email: "anil.k@hotmail.com"
      }
    },
    {
      name: "Positive Review (5-Star)",
      payload: {
        id: "rev-mock-pos",
        rating: 5,
        title: "Smells divine!",
        review_text: "Absolutely genuine oil. The fragrance is natural and my skin feels extremely nourished.",
        product_title: "Organic Coconut Oil 500ml",
        customer_name: "Sonia Sen",
        email: "sonias@yahoo.com"
      }
    }
  ],
  "CUSTOMER_SIGNUP": [
    {
      name: "New Store Signup",
      payload: {
        id: "usr-mock-new",
        customer_id: "usr-mock-new",
        customer_name: "Vikram Malhotra",
        email: "vikram.m@outlook.com",
        phone: "+91 98765 43210",
        created_at: new Date().toISOString()
      }
    }
  ],
  "payment_success": [
    {
      name: "Mock Payment Success",
      payload: {
        id: "pay-success-1",
        order_number: "ORD-9999",
        total: 2500,
        payment_method: "Razorpay",
        customer_name: "Ravi Teja",
        email: "ravi.t@example.com",
        customer_phone: "+919876543210"
      }
    }
  ],
  "payment_failed": [
    {
      name: "Mock Payment Failed",
      payload: {
        id: "pay-fail-1",
        order_number: "ORD-9998",
        total: 450,
        payment_method: "Razorpay",
        customer_name: "Sita Ram",
        email: "sita@example.com",
        customer_phone: "+918888888888"
      }
    }
  ]
}

const PLACEHOLDERS = [
  "{customer_name}",
  "{customer_email}",
  "{customer_phone}",
  "{customer_address}",
  "{order_number}",
  "{order_total}",
  "{products_list}",
  "{payment_method}",
  "{product_title}",
  "{rating}",
  "{review_text}",
  "{verify_order_button}",
  "{verify_order_url}"
]

export default function CreateWorkflowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [workflowName, setWorkflowName] = React.useState("New Automation Workflow")
  const [triggerType, setTriggerType] = React.useState("ORDER_PLACED")
  const [nodes, setNodes] = React.useState<any[]>([])
  const [edges, setEdges] = React.useState<WorkflowEdge[]>([])
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  
  const [draggingNodeId, setDraggingNodeId] = React.useState<string | null>(null)
  const [dragStart, setDragStart] = React.useState({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 })
  const [scale, setScale] = React.useState(1)

  const [admins, setAdmins] = React.useState<any[]>([])

  React.useEffect(() => {
    async function fetchAdmins() {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('id, email, full_name').eq('role', 'admin')
      if (data) setAdmins(data)
    }
    fetchAdmins()
  }, [])

  const [activeInputRef, setActiveInputRef] = React.useState<any>(null)
  const [showVariablePicker, setShowVariablePicker] = React.useState(false)

  const [isSimulating, setIsSimulating] = React.useState(false)
  const [simulationPayload, setSimulationPayload] = React.useState<any>({})
  const [simSteps, setSimSteps] = React.useState<WorkflowLogStep[]>([])
  const [simStepIndex, setSimStepIndex] = React.useState(-1)
  const [simActiveNodeId, setSimActiveNodeId] = React.useState<string | null>(null)

  const initializeEmptyWorkflow = React.useCallback((type: string) => {
    const triggerNode = {
      id: "node-trigger",
      type: "trigger",
      label: "When Event Occurs",
      x: 350,
      y: 50,
      config: { triggerType: type }
    }
    setNodes([triggerNode])
    setEdges([])
    setSelectedNodeId("node-trigger")
  }, [])

  React.useEffect(() => {
    async function loadWorkflow() {
      if (!editId) {
        initializeEmptyWorkflow("ORDER_PLACED")
        return
      }
      try {
        const workflows = await getWorkflows()
        const found = workflows.find(w => w.id === editId)
        if (found) {
          setWorkflowName(found.name)
          setTriggerType(found.trigger_type)
          
          const hydratedNodes = found.nodes.map((n: any, idx: number) => {
            if (n.x !== undefined && n.y !== undefined) return n
            if (n.type === "trigger") return { ...n, x: 350, y: 50 }
            if (n.type === "condition") return { ...n, x: 350, y: 220 }
            return { ...n, x: 150 + (idx * 160), y: 400 }
          })

          setNodes(hydratedNodes)
          setEdges(found.edges || [])
          setSelectedNodeId(hydratedNodes[0]?.id || null)
        }
      } catch (err) {
        console.error("Error loading workflow for editing:", err)
      }
    }
    loadWorkflow()
  }, [editId, initializeEmptyWorkflow])

  const handleTriggerChange = (newType: string) => {
    setTriggerType(newType)
    initializeEmptyWorkflow(newType)
    setSimSteps([])
    setSimStepIndex(-1)
  }

  const handleNodePointerDown = (id: string, e: React.PointerEvent) => {
    const node = nodes.find(n => n.id === id)
    if (!node) return
    e.stopPropagation() 
    
    if ((e.target as HTMLElement).closest(".btn-no-drag")) return

    setDraggingNodeId(id)
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.x || 0,
      nodeY: node.y || 0
    })
    
    setSelectedNodeId(id)
    setSimSteps([])
    setSimStepIndex(-1)
    
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!draggingNodeId) return
    
    const dx = (e.clientX - dragStart.mouseX) / scale
    const dy = (e.clientY - dragStart.mouseY) / scale
    
    const newX = Math.round((dragStart.nodeX + dx) / 10) * 10
    const newY = Math.round((dragStart.nodeY + dy) / 10) * 10
    
    setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) } : n))
  }

  const handleNodePointerUp = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setDraggingNodeId(null)
    }
  }

  const addConditionNode = () => {
    const id = `node-cond-${Date.now()}`
    const trigger = nodes.find(n => n.type === "trigger")
    
    const newNode = {
      id,
      type: "condition",
      label: "Check Condition",
      x: 350,
      y: 200,
      config: {
        conditionField: CONDITION_FIELDS[triggerType as keyof typeof CONDITION_FIELDS]?.[0]?.id || "total",
        conditionOperator: "gte",
        conditionValue: "1000"
      }
    }

    setNodes(prev => [...prev, newNode])
    setSelectedNodeId(id)

    const triggerOutputs = edges.filter(e => e.source === "node-trigger")
    if (triggerOutputs.length === 0 && trigger) {
      setEdges(prev => [...prev, { id: `edge-${Date.now()}`, source: "node-trigger", target: id }])
    }
  }

  const addActionNode = () => {
    const id = `node-act-${Date.now()}`
    const newNode = {
      id,
      type: "action",
      label: "Send Automation Action",
      x: 350,
      y: 350,
      config: {
        actionType: "email",
        emailTo: "customer",
        emailSubject: "Your order details",
        emailBody: "Hi {customer_name}, thanks for shopping!",
        webhookUrl: "https://webhook.site/mock-endpoint",
        webhookPayload: JSON.stringify({ event: "{trigger_event}", total: "{total}" }, null, 2),
        timelineNote: "Automation action executed."
      }
    }

    setNodes(prev => [...prev, newNode])
    setSelectedNodeId(id)
  }

  const addWaitNode = () => {
    const id = `node-wait-${Date.now()}`
    setNodes(prev => [...prev, {
      id, type: "action", label: "Wait / Delay", x: 350, y: 350,
      config: { actionType: "wait", delayMs: 5000 }
    }])
    setSelectedNodeId(id)
  }

  const addEdgeConnection = (sourceId: string, targetId: string, conditionBranch?: "true" | "false") => {
    if (sourceId === targetId) return
    
    const exists = edges.some(e => e.source === sourceId && e.target === targetId && e.conditionBranch === conditionBranch)
    if (exists) return

    const sourceNode = nodes.find(n => n.id === sourceId)
    if (!sourceNode) return

    if (sourceNode.type === "condition") {
      if (!conditionBranch) return 
      setEdges(prev => prev.filter(e => !(e.source === sourceId && e.conditionBranch === conditionBranch)))
    } else {
      setEdges(prev => prev.filter(e => e.source !== sourceId))
    }

    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
      conditionBranch
    }
    setEdges(prev => [...prev, newEdge])
  }

  const removeNode = (id: string) => {
    if (id === "node-trigger") return 
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    if (selectedNodeId === id) setSelectedNodeId("node-trigger")
  }

  const removeEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
  }

  const updateNodeConfig = (updatedConfig: any) => {
    if (!selectedNodeId) return
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { 
      ...n, 
      config: { ...n.config, ...updatedConfig } 
    } : n))
  }

  const updateNodeLabel = (newLabel: string) => {
    if (!selectedNodeId) return
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, label: newLabel } : n))
  }

  const getNodeAnchorPoint = (nodeId: string, position: "top" | "bottom" | "left" | "right") => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    
    const nodeWidth = 240
    const nodeHeight = 85

    switch (position) {
      case "top": return { x: (node.x || 0) + nodeWidth / 2, y: node.y || 0 }
      case "bottom": return { x: (node.x || 0) + nodeWidth / 2, y: (node.y || 0) + nodeHeight }
      case "left": return { x: node.x || 0, y: (node.y || 0) + nodeHeight / 2 }
      case "right": return { x: (node.x || 0) + nodeWidth, y: (node.y || 0) + nodeHeight / 2 }
    }
  }

  const handleVariableClick = (variable: string) => {
    if (!activeInputRef) return
    const input = activeInputRef
    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const val = input.value
    const newVal = val.substring(0, start) + variable + val.substring(end)
    
    const name = input.name
    updateNodeConfig({ [name]: newVal })

    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + variable.length, start + variable.length)
    }, 10)

    setShowVariablePicker(false)
  }

  const handleSave = async () => {
    if (!workflowName.trim()) {
      alert("Please provide a workflow name.")
      return
    }

    const payload: Workflow = {
      id: editId || `flow-${Date.now()}`,
      name: workflowName,
      trigger_type: triggerType,
      is_active: true,
      nodes,
      edges,
      run_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const success = await upsertWorkflow(payload)
    if (success) {
      router.push("/admin/workflows")
    } else {
      alert("Failed to save workflow automation. Please verify connection.")
    }
  }

  const handleRunSimulation = async (payloadItem: any) => {
    setIsSimulating(true)
    setSimulationPayload(payloadItem)
    
    const mockWorkflow: Workflow = {
      id: "sim-flow",
      name: workflowName,
      trigger_type: triggerType,
      is_active: true,
      nodes,
      edges,
      run_count: 0,
      created_at: "",
      updated_at: ""
    }

    try {
      const steps = await simulateWorkflowExecution(mockWorkflow, payloadItem)
      setSimSteps(steps)
      
      setSimStepIndex(-1)
      setSimActiveNodeId(null)

      let currentStepIdx = 0
      const interval = setInterval(() => {
        if (currentStepIdx < steps.length) {
          setSimStepIndex(currentStepIdx)
          const activeNodeId = steps[currentStepIdx].nodeId
          setSimActiveNodeId(activeNodeId)
          setSelectedNodeId(activeNodeId)
          currentStepIdx++
        } else {
          clearInterval(interval)
          setSimActiveNodeId(null)
        }
      }, 1500)

    } catch (err) {
      console.error("Simulation failed:", err)
    } finally {
      setIsSimulating(false)
    }
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  return (
    <div 
      className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans"
    >
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/workflows">
            <Button variant="ghost" size="sm" className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-bold text-zinc-900 dark:text-zinc-50 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-600 outline-none px-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-500 font-semibold uppercase">Trigger Type:</label>
          <select
            value={triggerType}
            onChange={(e) => handleTriggerChange(e.target.value)}
            disabled={editId !== null && editId !== undefined}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {TRIGGER_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <Button 
            onClick={handleSave}
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-5 space-y-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Add Logic Nodes</h3>
              <div className="space-y-2">
                <button
                  onClick={addConditionNode}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white hover:bg-zinc-50 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 transition duration-150 group text-left"
                >
                  <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <GitBranch className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Branch Logic</h4>
                    <p className="text-[10px] text-zinc-400">Check values & route paths</p>
                  </div>
                </button>

                <button
                  onClick={addActionNode}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white hover:bg-zinc-50 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 transition duration-150 group text-left"
                >
                  <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Play className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Action Node</h4>
                    <p className="text-[10px] text-zinc-400">Emails, webhooks, notes</p>
                  </div>
                </button>
                
                <button
                  onClick={addWaitNode}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white hover:bg-zinc-50 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 transition duration-150 group text-left"
                >
                  <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Wait Step</h4>
                    <p className="text-[10px] text-zinc-400">Pause flow execution</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl p-4">
              <h4 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Connection Tips
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                Connect nodes by selecting a source node first. Then in the sidebar, choose the connection targets under Node Settings. Use true/false branches for logic routing.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Live Simulation Test</h3>
            <div className="space-y-2">
              {TEMPLATE_PAYLOADS[triggerType as keyof typeof TEMPLATE_PAYLOADS]?.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleRunSimulation(tpl.payload)}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-between text-xs font-semibold px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800/40 rounded-xl bg-white hover:bg-indigo-50 hover:border-indigo-200 text-zinc-700 dark:text-zinc-300 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 dark:hover:border-indigo-900 transition"
                >
                  <span className="truncate">{tpl.name}</span>
                  <PlayCircle className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#fafafa]">
          <TransformWrapper
            initialScale={1}
            minScale={0.2}
            maxScale={2}
            centerOnInit={false}
            limitToBounds={false}
            panning={{ excluded: ["nodrag"] }}
            wheel={{ step: 0.1 }}
            onTransform={(ref) => setScale(ref.state.scale)}
          >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "3000px", height: "3000px", backgroundImage: "radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}>
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
            {edges.map((edge) => {
              const start = getNodeAnchorPoint(edge.source, edge.conditionBranch ? (edge.conditionBranch === "true" ? "left" : "right") : "bottom")
              const end = getNodeAnchorPoint(edge.target, "top")
              
              const dx = end.x - start.x
              const dy = end.y - start.y
              const c1x = start.x
              const c1y = start.y + dy * 0.5
              const c2x = end.x
              const c2y = end.y - dy * 0.5
              const pathD = `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`
              
              const isPathActive = simStepIndex > -1 && 
                simSteps.some((step, idx) => 
                  idx <= simStepIndex && 
                  step.nodeId === edge.target && 
                  simSteps[idx - 1]?.nodeId === edge.source
                )

              return (
                <g key={edge.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="15"
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => {
                      if (confirm("Delete this connection line?")) {
                        removeEdge(edge.id)
                      }
                    }}
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isPathActive ? "#6366f1" : "#cbd5e1"}
                    strokeWidth={isPathActive ? "3" : "2"}
                    className={cn(
                      "transition-all duration-300",
                      isPathActive && "animate-pulse stroke-[3px]"
                    )}
                  />
                  {edge.conditionBranch && (
                    <foreignObject
                      x={start.x + (dx * 0.25) - 25}
                      y={start.y + (dy * 0.25) - 10}
                      width="50"
                      height="20"
                    >
                      <div className={cn(
                        "text-[9px] uppercase font-bold text-center py-0.5 rounded border shadow-sm",
                        edge.conditionBranch === "true" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      )}>
                        {edge.conditionBranch}
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </svg>

          <div className="absolute inset-0 z-10 pointer-events-none">
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id
              const isActiveInSim = simActiveNodeId === node.id

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleNodePointerUp}
                  className={cn(
                    "nodrag absolute w-60 bg-white dark:bg-zinc-900 border rounded-xl shadow-md pointer-events-auto cursor-grab transition-shadow select-none",
                    isSelected ? "border-indigo-600 ring-1 ring-indigo-600" : "border-zinc-200 dark:border-zinc-800",
                    isActiveInSim && "ring-4 ring-indigo-500/40 border-indigo-500 scale-[1.02] shadow-indigo-100",
                    draggingNodeId === node.id && "cursor-grabbing shadow-lg z-20"
                  )}
                >
                  <div className={cn(
                    "px-4 py-2.5 border-b flex justify-between items-center rounded-t-xl text-xs font-bold",
                    node.type === "trigger" ? "bg-indigo-50/50 text-indigo-700 border-indigo-100" :
                    node.type === "condition" ? "bg-purple-50/50 text-purple-700 border-purple-100" :
                    "bg-emerald-50/50 text-emerald-700 border-emerald-100"
                  )}>
                    <div className="flex items-center gap-1.5 truncate">
                      {node.type === "trigger" && <Database className="h-3.5 w-3.5" />}
                      {node.type === "condition" && <GitBranch className="h-3.5 w-3.5" />}
                      {node.type === "action" && <Play className="h-3.5 w-3.5" />}
                      <span className="truncate">{node.label}</span>
                    </div>

                    {node.type !== "trigger" && (
                      <button
                        onClick={() => removeNode(node.id)}
                        className="btn-no-drag p-1 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-white dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-1 text-[11px] text-zinc-500">
                    {node.type === "trigger" && (
                      <p>Active Trigger Event: <strong className="text-zinc-800 dark:text-zinc-300 font-mono">{node.config.triggerType}</strong></p>
                    )}

                    {node.type === "condition" && (
                      <div className="space-y-0.5 font-mono">
                        <p>If field: <strong className="text-purple-600">{node.config.conditionField}</strong></p>
                        <p>{node.config.conditionOperator} &ldquo;{node.config.conditionValue}&rdquo;</p>
                      </div>
                    )}

                    {node.type === "action" && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 uppercase font-bold text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 w-max">
                          {node.config.actionType === "email" && <Mail className="h-2.5 w-2.5" />}
                          {node.config.actionType === "webhook" && <Globe className="h-2.5 w-2.5" />}
                          {node.config.actionType === "timeline" && <FileText className="h-2.5 w-2.5" />}
                          {node.config.actionType}
                        </div>
                        {node.config.actionType === "email" && (
                          <p className="truncate">To: <span className="text-zinc-700 font-medium">{node.config.emailTo}</span> | Subject: &ldquo;{node.config.emailSubject}&rdquo;</p>
                        )}
                        {node.config.actionType === "webhook" && (
                          <p className="truncate font-mono text-[9px]">{node.config.webhookUrl}</p>
                        )}
                        {node.config.actionType === "timeline" && (
                          <p className="truncate italic">&ldquo;{node.config.timelineNote}&rdquo;</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </TransformComponent>
          </TransformWrapper>

          {simStepIndex > -1 && (
            <div className="absolute bottom-4 left-4 z-20 max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xl flex items-start gap-3 pointer-events-none">
              <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-zinc-950 dark:text-zinc-50">Simulation Step Active</h4>
                <p className="text-[11px] font-mono text-zinc-500 mt-1 p-2 bg-zinc-50 dark:bg-zinc-950 rounded">
                  {simSteps[simStepIndex]?.details}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-5 space-y-6 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Node Label</h3>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => updateNodeLabel(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {selectedNode.type === "trigger" && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase">Trigger Config</h4>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-600">
                    This node initiates the execution flow automatically whenever a <strong>{triggerType}</strong> event is caught by the server action pipeline.
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Configure Routing Links</h5>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-zinc-500">Add logic routing paths from this trigger:</p>
                      {nodes.filter(n => n.id !== "node-trigger").map(n => (
                        <button
                          key={n.id}
                          onClick={() => addEdgeConnection("node-trigger", n.id)}
                          className="w-full text-left text-[11px] px-3 py-1.5 rounded border border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 transition truncate"
                        >
                          Connect to &ldquo;{n.label}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === "condition" && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase">Condition Node Rules</h4>
                  
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Check Field:</label>
                    <select
                      value={selectedNode.config.conditionField}
                      onChange={(e) => updateNodeConfig({ conditionField: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:outline-none"
                    >
                      {CONDITION_FIELDS[triggerType as keyof typeof CONDITION_FIELDS]?.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {(selectedNode.config.conditionField === "payment_method" || selectedNode.config.conditionField === "payment_status") ? (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Operator:</label>
                      <div className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                        Is Exactly (Equals)
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Operator:</label>
                      <select
                        value={selectedNode.config.conditionOperator || "equals"}
                        onChange={(e) => updateNodeConfig({ conditionOperator: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:outline-none"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains (text)</option>
                        <option value="gte">Greater Than or Equal (Number &ge;)</option>
                        <option value="lte">Less Than or Equal (Number &le;)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Target Compare Value:</label>
                    {selectedNode.config.conditionField === "payment_method" ? (
                      <select
                        value={selectedNode.config.conditionValue || ""}
                        onChange={(e) => updateNodeConfig({ conditionValue: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      >
                        <option value="">Select Method...</option>
                        <option value="COD">Cash on Delivery (COD)</option>
                        <option value="Razorpay">Razorpay (Online)</option>
                      </select>
                    ) : selectedNode.config.conditionField === "payment_status" ? (
                      <select
                        value={selectedNode.config.conditionValue || ""}
                        onChange={(e) => updateNodeConfig({ conditionValue: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      >
                        <option value="">Select Status...</option>
                        <option value="paid">Paid (Success)</option>
                        <option value="failed">Failed / Cancelled</option>
                        <option value="pending">Pending (COD)</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedNode.config.conditionValue || ""}
                        onChange={(e) => updateNodeConfig({ conditionValue: e.target.value })}
                        placeholder="e.g. 5000 or COD"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      />
                    )}
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase">Logic Branch Connections</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold block mb-1">On TRUE branch:</span>
                        {nodes.filter(n => n.id !== selectedNode.id && n.id !== "node-trigger").map(n => (
                          <button
                            key={n.id}
                            onClick={() => addEdgeConnection(selectedNode.id, n.id, "true")}
                            className="w-full text-left text-[11px] px-3 py-1 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-700 border border-emerald-200 rounded mb-1 truncate"
                          >
                            Route to &ldquo;{n.label}&rdquo;
                          </button>
                        ))}
                      </div>

                      <div>
                        <span className="text-[10px] text-rose-600 font-bold block mb-1">On FALSE branch:</span>
                        {nodes.filter(n => n.id !== selectedNode.id && n.id !== "node-trigger").map(n => (
                          <button
                            key={n.id}
                            onClick={() => addEdgeConnection(selectedNode.id, n.id, "false")}
                            className="w-full text-left text-[11px] px-3 py-1 bg-rose-50/50 hover:bg-rose-100/50 text-rose-700 border border-rose-200 rounded mb-1 truncate"
                          >
                            Route to &ldquo;{n.label}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === "action" && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase">Action Settings</h4>
                  
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Action Type:</label>
                    <select
                      value={selectedNode.config.actionType || "email"}
                      onChange={(e) => updateNodeConfig({ actionType: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:outline-none"
                    >
                      <option value="email">Send Custom Email</option>
                      <option value="webhook">Post Outbound Webhook URL</option>
                      <option value="timeline">Log Internal order timeline Note</option>
                      <option value="add_customer_tag">Add Customer Tag</option>
                      <option value="wait">Wait / Delay (Pause execution)</option>
                      <option value="add_to_google_sheet">Append to Google Sheets</option>
                      <option value="sms">Send Mobile SMS</option>
                    </select>
                  </div>

                  {selectedNode.config.actionType === "wait" && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Delay (in milliseconds):</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedNode.config.delayMs || 5000}
                        onChange={(e) => updateNodeConfig({ delayMs: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Example: 5000 = 5 seconds.</p>
                    </div>
                  )}

                  {selectedNode.config.actionType === "add_to_google_sheet" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Google Apps Script Webhook URL:</label>
                        <input
                          type="url"
                          value={selectedNode.config.webhookUrl || ""}
                          onChange={(e) => updateNodeConfig({ webhookUrl: e.target.value })}
                          placeholder="e.g. https://script.google.com/macros/s/.../exec"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Row Data (JSON format):</label>
                        <textarea
                          rows={6}
                          name="webhookPayload"
                          value={selectedNode.config.webhookPayload || "{}"}
                          onFocus={(e) => setActiveInputRef(e.target)}
                          onChange={(e) => updateNodeConfig({ webhookPayload: e.target.value })}
                          className="w-full text-[11px] font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.config.actionType === "sms" && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Target Phone Number:</label>
                          <button onClick={() => setShowVariablePicker(true)} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"><Sparkles className="h-2.5 w-2.5" /> Variables</button>
                        </div>
                        <input
                          type="text"
                          name="smsPhone"
                          value={selectedNode.config.smsPhone || ""}
                          onFocus={(e) => setActiveInputRef(e.target)}
                          onChange={(e) => updateNodeConfig({ smsPhone: e.target.value })}
                          placeholder="e.g. {customer_phone}"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">SMS Text Body:</label>
                        </div>
                        <textarea
                          rows={4}
                          name="smsBody"
                          value={selectedNode.config.smsBody || ""}
                          onFocus={(e) => setActiveInputRef(e.target)}
                          onChange={(e) => updateNodeConfig({ smsBody: e.target.value })}
                          placeholder="Hi {customer_name}, your order was successful!"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.config.actionType === "email" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">To Recipient:</label>
                        <select
                          value={selectedNode.config.emailTo || "customer"}
                          onChange={(e) => updateNodeConfig({ emailTo: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
                        >
                          <option value="customer">Triggering Customer Email</option>
                          <option value="admin">Store Admin Email</option>
                          <option value="custom">Custom Email Address</option>
                        </select>
                        {selectedNode.config.emailTo === "admin" && (
                          <div className="mt-2 space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Select Target Admins:</label>
                            {admins.length === 0 ? (
                               <p className="text-[10px] text-zinc-500">Loading admins or no admins found...</p>
                            ) : (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {admins.map((admin) => (
                                  <label key={admin.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                                    <input 
                                      type="checkbox" 
                                      checked={(selectedNode.config.selectedAdmins || []).includes(admin.email)}
                                      onChange={(e) => {
                                        const current = selectedNode.config.selectedAdmins || []
                                        if (e.target.checked) {
                                          updateNodeConfig({ selectedAdmins: [...current, admin.email] })
                                        } else {
                                          updateNodeConfig({ selectedAdmins: current.filter((email: string) => email !== admin.email) })
                                        }
                                      }}
                                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                                    />
                                    <div className="text-[11px] leading-tight flex-1 truncate">
                                      <span className="font-bold text-zinc-700 dark:text-zinc-300 block">{admin.full_name || "Admin"}</span>
                                      <span className="text-zinc-500 font-mono text-[9px]">{admin.email}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                            <p className="text-[9px] text-zinc-400 italic mt-1 leading-tight">If none are selected, emails will default to all admins.</p>
                          </div>
                        )}
                        {selectedNode.config.emailTo === "custom" && (
                          <div className="mt-2">
                            <input
                              type="email"
                              value={selectedNode.config.customEmailAddress || ""}
                              onChange={(e) => updateNodeConfig({ customEmailAddress: e.target.value })}
                              placeholder="e.g. accounts@example.com"
                              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Subject:</label>
                          <button
                            onClick={() => setShowVariablePicker(true)}
                            className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> Variables
                          </button>
                        </div>
                        <input
                          type="text"
                          name="emailSubject"
                          value={selectedNode.config.emailSubject || ""}
                          onFocus={(e) => setActiveInputRef(e.target)}
                          onChange={(e) => updateNodeConfig({ emailSubject: e.target.value })}
                          placeholder="e.g. Order Placed #{order_number}!"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Body Text:</label>
                        <textarea
                          rows={6}
                          name="emailBody"
                          value={selectedNode.config.emailBody || ""}
                          onFocus={(e) => setActiveInputRef(e.target)}
                          onChange={(e) => updateNodeConfig({ emailBody: e.target.value })}
                          placeholder="Hi {customer_name}, your order total was {order_total}..."
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.config.actionType === "webhook" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Target Post URL:</label>
                        <input
                          type="url"
                          value={selectedNode.config.webhookUrl || ""}
                          onChange={(e) => updateNodeConfig({ webhookUrl: e.target.value })}
                          placeholder="e.g. https://webhook.site/my-key"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">JSON Raw Body Payload:</label>
                        <textarea
                          rows={6}
                          name="webhookPayload"
                          value={selectedNode.config.webhookPayload || ""}
                          onFocus={(e) => setActiveInputRef(e.target)}
                          onChange={(e) => updateNodeConfig({ webhookPayload: e.target.value })}
                          className="w-full text-[11px] font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {(selectedNode.config.actionType === "timeline" || selectedNode.config.actionType === "add_customer_tag") && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{selectedNode.config.actionType === "timeline" ? "Internal Timeline note:" : "Customer Tag Name:"}</label>
                        <button
                          onClick={() => setShowVariablePicker(true)}
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> Variables
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        name="timelineNote"
                        value={selectedNode.config.timelineNote || ""}
                        onFocus={(e) => setActiveInputRef(e.target)}
                        onChange={(e) => updateNodeConfig({ timelineNote: e.target.value })}
                        placeholder="e.g. high value VIP order detected."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 border-t pt-4">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase">Link sequential path</h5>
                    <p className="text-[10px] text-zinc-500">Route flow to the next action/branch:</p>
                    {nodes.filter(n => n.id !== selectedNode.id && n.id !== "node-trigger").map(n => (
                      <button
                        key={n.id}
                        onClick={() => addEdgeConnection(selectedNode.id, n.id)}
                        className="w-full text-left text-[11px] px-3 py-1.5 rounded border border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 transition truncate"
                      >
                        Route next to &ldquo;{n.label}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-400 border border-dashed rounded-xl p-4">
              <HelpCircle className="h-8 w-8 mb-2 text-zinc-300" />
              <p className="text-xs">Select any node on the grid canvas to configure settings and routing links.</p>
            </div>
          )}
        </div>
      </div>

      {showVariablePicker && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/40">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Select Event Placeholder
              </h3>
              <button 
                onClick={() => setShowVariablePicker(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto">
              {PLACEHOLDERS.map(p => (
                <button
                  key={p}
                  onClick={() => handleVariableClick(p)}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-lg transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}