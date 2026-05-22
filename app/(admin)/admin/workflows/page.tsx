"use client"

import * as React from "react"
import { 
  getWorkflows, 
  getWorkflowLogs, 
  upsertWorkflow, 
  deleteWorkflow, 
  clearWorkflowLogs 
} from "@/app/actions/workflows"
import { 
  GitBranch, 
  Plus, 
  Play, 
  Activity, 
  Trash2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  RefreshCw, 
  Mail, 
  Globe, 
  FileText,
  AlertTriangle,
  Info,
  Search,
  ChevronLeft as ChevronLeftIcon
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = React.useState<any[]>([])
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [logsLoading, setLogsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"workflows" | "logs">("workflows")
  const [expandedLog, setExpandedLog] = React.useState<string | null>(null)

  // Logs pagination and filtering
  const [logsSearchQuery, setLogsSearchQuery] = React.useState("")
  const [logsCurrentPage, setLogsCurrentPage] = React.useState(1)
  const LOGS_PER_PAGE = 10

  // Reset to first page when searching
  React.useEffect(() => {
    setLogsCurrentPage(1)
  }, [logsSearchQuery])

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const q = logsSearchQuery.toLowerCase()
      return (
        log.workflow_name?.toLowerCase().includes(q) ||
        log.trigger_event?.toLowerCase().includes(q) ||
        log.status?.toLowerCase().includes(q)
      )
    })
  }, [logs, logsSearchQuery])

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE)
  const currentLogs = filteredLogs.slice(
    (logsCurrentPage - 1) * LOGS_PER_PAGE,
    logsCurrentPage * LOGS_PER_PAGE
  )

  // Fetch workflows and logs
  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const wList = await getWorkflows()
      const logList = await getWorkflowLogs()
      setWorkflows(wList)
      setLogs(logList)
    } catch (err) {
      console.error("Error loading workflows/logs:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleWorkflowStatus = async (workflow: any) => {
    const updated = { ...workflow, is_active: !workflow.is_active }
    // Update locally first
    setWorkflows(prev => prev.map(w => w.id === workflow.id ? updated : w))
    
    try {
      await upsertWorkflow(updated)
    } catch (err) {
      console.error("Failed to toggle status:", err)
      // Revert if error
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? workflow : w))
    }
  }

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) return
    
    setWorkflows(prev => prev.filter(w => w.id !== id))
    try {
      await deleteWorkflow(id)
    } catch (err) {
      console.error("Failed to delete workflow:", err)
      fetchData()
    }
  }

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all execution logs?")) return
    
    setLogsLoading(true)
    try {
      const res = await clearWorkflowLogs()
      if (res) setLogs([])
    } catch (err) {
      console.error("Failed to clear logs:", err)
    } finally {
      setLogsLoading(false)
    }
  }

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "ORDER_PLACED": return "Order Placed"
      case "REVIEW_RECEIVED": return "Review Submitted"
      case "CUSTOMER_SIGNUP": return "New Customer Signup"
      default: return type
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "email": return <Mail className="h-4 w-4 text-sky-500" />
      case "webhook": return <Globe className="h-4 w-4 text-emerald-500" />
      case "timeline": return <FileText className="h-4 w-4 text-amber-500" />
      default: return <GitBranch className="h-4 w-4 text-purple-500" />
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Workflows & Automations
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Build, test, and trace visual triggers, branching logic, and custom transactional pipelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="flex items-center gap-2 border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/admin/workflows/create">
            <Button size="sm" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("workflows")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "workflows"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Active Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Activity className="h-4 w-4" />
            Execution Logs ({logs.length})
          </button>
        </div>

        {activeTab === "logs" && logs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLogs}
            disabled={logsLoading}
            className="mb-2 text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-800 dark:hover:bg-rose-950/20"
          >
            Clear History
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-zinc-500 text-sm">Loading automation engine details...</p>
        </div>
      ) : activeTab === "workflows" ? (
        workflows.length === 0 ? (
          <div className="border border-zinc-200/60 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3 hover:rotate-6 transition-transform">
              <GitBranch className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="font-bold text-xl tracking-tight text-zinc-950 dark:text-zinc-50">No workflows configured</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-8 leading-relaxed max-w-sm mx-auto">
              Create automated recipes to dispatch confirmation emails, log internal notes, or fire custom webhooks when orders arrive.
            </p>
            <Link href="/admin/workflows/create">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-md shadow-indigo-500/20 rounded-xl border-0">
                Configure First Workflow
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => {
              const actions = workflow.nodes.filter((n: any) => n.type === "action")
              const conditions = workflow.nodes.filter((n: any) => n.type === "condition")

              return (
                <div 
                  key={workflow.id} 
                  className="group relative bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Subtle Top Gradient for active/inactive */}
                  <div className={`absolute top-0 inset-x-0 h-1 transition-colors duration-500 ${workflow.is_active ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />

                  <div className="p-6 space-y-5">
                    {/* Header: Title and Toggle */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${workflow.is_active ? 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                            {getTriggerLabel(workflow.trigger_type)}
                          </span>
                          
                          {/* Active Status Switch */}
                          <button
                            onClick={() => toggleWorkflowStatus(workflow)}
                            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                              workflow.is_active ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                          >
                            <span className="sr-only">Toggle Workflow</span>
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
                                workflow.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg tracking-tight text-zinc-950 dark:text-white line-clamp-1">
                          {workflow.name}
                        </h3>
                      </div>
                    </div>

                    {/* Nodes structure details - Modern Stats */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800/60">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Conditions</span>
                        <div className="flex items-center gap-1.5 font-medium text-sm text-zinc-800 dark:text-zinc-200">
                           <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
                           {conditions.length === 0 ? "Instant" : `${conditions.length} Rule(s)`}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Actions</span>
                        <div className="flex items-center gap-1 font-medium text-sm text-zinc-800 dark:text-zinc-200 flex-wrap">
                           {actions.length === 0 ? (
                             <span className="text-zinc-400">None</span>
                           ) : (
                             actions.map((act: any, i: number) => (
                               <span key={i} title={act.label} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                 {getActionIcon(act.config.actionType)}
                               </span>
                             ))
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Runs statistics */}
                    <div className="flex justify-between items-center text-[11px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-1 rounded-md">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        {workflow.run_count || 0} Runs
                      </span>
                      <span>
                        Updated {new Date(workflow.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 flex gap-2">
                    <Link href={`/admin/workflows/create?edit=${workflow.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        className="w-full relative overflow-hidden group/btn bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all font-semibold rounded-xl"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                           Visual Editor
                           <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </Link>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="border-zinc-200/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-zinc-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-900 transition-colors rounded-xl px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Logs tab UI */
        logs.length === 0 ? (
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center max-w-xl mx-auto">
            <Activity className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-zinc-950 dark:text-zinc-50">No logs generated</h3>
            <p className="text-sm text-zinc-500 mt-2">
              Trigger automation logs by placing an order on the storefront, adding a review, or simulating a run inside the visual canvas editor.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div className="relative w-full sm:w-72">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Search workflows, events, or status..."
                   value={logsSearchQuery}
                   onChange={(e) => setLogsSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-zinc-100"
                 />
                 {logsSearchQuery && (
                   <button 
                     onClick={() => setLogsSearchQuery("")}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 )}
               </div>
               <div className="text-xs text-zinc-500">
                 Showing {filteredLogs.length} matching logs
               </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-8 text-center text-zinc-500 text-sm">
                No logs match your search. Try different keywords.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                    <th className="py-4 px-6 w-8"></th>
                    <th className="py-4 px-6">Workflow</th>
                    <th className="py-4 px-6">Event</th>
                    <th className="py-4 px-6">Executed At</th>
                    <th className="py-4 px-6">Fired Steps</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                  {currentLogs.map((log) => {
                    const isExpanded = expandedLog === log.id
                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="hover:bg-zinc-50/55 dark:hover:bg-zinc-800/30 cursor-pointer transition"
                        >
                          <td className="py-4 px-6 text-zinc-400">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                            {log.workflow_name}
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[11px] font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                              {log.trigger_event}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-zinc-500 text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300 text-xs">
                            {log.steps_executed.length} steps
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              log.status === "success"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {log.status === "success" ? "Success" : "Failed"}
                            </span>
                          </td>
                        </tr>
                        
                        {/* Expandable Trace detail drawer */}
                        {isExpanded && (
                          <tr className="bg-zinc-50/60 dark:bg-zinc-950/20">
                            <td colSpan={6} className="py-4 px-8">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Left context: Payload */}
                                  <div className="lg:col-span-1 space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                      <Info className="h-3 w-3" />
                                      Execution Payload
                                    </h4>
                                    <pre className="text-[11px] font-mono p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg max-h-56 overflow-y-auto overflow-x-hidden text-zinc-700 dark:text-zinc-300">
                                      {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                  </div>

                                  {/* Right context: Step Tracing */}
                                  <div className="lg:col-span-2 space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                      Execution Path Steps (Trace)
                                    </h4>
                                    <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-4 py-1">
                                      {log.steps_executed.map((step: any, idx: number) => (
                                        <div key={idx} className="relative">
                                          {/* Circle icon marker */}
                                          <div className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center justify-center ${
                                            step.status === "success"
                                              ? "border-emerald-500 text-emerald-500"
                                              : step.status === "failed"
                                              ? "border-rose-500 text-rose-500"
                                              : "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                                          }`}>
                                            {step.status === "success" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                            {step.status === "failed" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-200">{step.label}</span>
                                              <span className="text-[10px] text-zinc-400 capitalize">({step.type})</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 whitespace-pre-wrap font-mono bg-zinc-100/50 dark:bg-zinc-900 p-2 rounded">
                                              {step.details}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {log.error_message && (
                                      <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-lg text-xs font-medium">
                                        <AlertTriangle className="h-4 w-4" />
                                        Exception: {log.error_message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 px-2">
              <div className="text-sm text-zinc-500">
                Page <span className="font-medium text-zinc-900 dark:text-zinc-100">{logsCurrentPage}</span> of <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsCurrentPage(p => Math.max(1, p - 1))}
                  disabled={logsCurrentPage === 1}
                  className="bg-white dark:bg-zinc-900"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={logsCurrentPage === totalPages}
                  className="bg-white dark:bg-zinc-900"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          </div>
        )
      )}
    </div>
  )
}
