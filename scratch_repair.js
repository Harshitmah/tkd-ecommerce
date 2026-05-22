const fs = require('fs');

const chunkToRestore = \`          <input
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

      {/* Main Designer Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
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
                  onClick={() => {
                    const id = \\\`node-wait-\\\${Date.now()}\\\`
                    setNodes(prev => [...prev, {
                      id, type: "action", label: "Wait / Delay", x: 350, y: 350,
                      config: { actionType: "wait", delayMs: 5000 }
                    }])
                    setSelectedNodeId(id)
                  }}
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

            {/* Connection Instructions */}
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

          {/* Simulator Panel in toolbar footer */}
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

        {/* Center Dotted Grid Canvas */}
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
              
              {/* Connector Lines SVG Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
            {edges.map((edge) => {
              const start = getNodeAnchorPoint(edge.source, edge.conditionBranch ? (edge.conditionBranch === "true" ? "left" : "right") : "bottom")
              const end = getNodeAnchorPoint(edge.target, "top")
              
              // Draw dynamic bezier path
              const dx = end.x - start.x
              const dy = end.y - start.y
              const c1x = start.x
              const c1y = start.y + dy * 0.5
              const c2x = end.x
              const c2y = end.y - dy * 0.5
              const pathD = \\\`M \\\${start.x} \\\${start.y} C \\\${c1x} \\\${c1y}, \\\${c2x} \\\${c2y}, \\\${end.x} \\\${end.y}\\\`
              
              // Check if path is actively executing in mock simulator
              const isPathActive = simStepIndex > -1 && 
                simSteps.some((step, idx) => 
                  idx <= simStepIndex && 
                  step.nodeId === edge.target && 
                  simSteps[idx - 1]?.nodeId === edge.source
                )

              return (
                <g key={edge.id}>
                  {/* Background interactive thicker transparent line */}
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
                  {/* Visible line */}
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
                  {/* Branch label text tag */}
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

          {/* Draggable Nodes Container */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id
              const isActiveInSim = simActiveNodeId === node.id

              return (
                <div
                  key={node.id}
                  style={{ left: \\\`\\\${node.x}px\\\`, top: \\\`\\\${node.y}px\\\` }}
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
                  {/* Node Header */}
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

                  {/* Node Details body */}
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
                          {node.config.actionType === "email" && <Mail className="h-2.5 w-2.5" />}\`;

const filePath = 'C:/Antigravity Project/tkd-ecommerce/app/(admin)/admin/workflows/create/page.tsx';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Find the start anchor (the separator div in top navbar)
const startAnchor = '<div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />';
const endAnchor = '{node.config.actionType === "webhook" && <Globe className="h-2.5 w-2.5" />}';

const startIndex = fileContent.indexOf(startAnchor);
const endIndex = fileContent.indexOf(endAnchor);

if (startIndex > -1 && endIndex > -1) {
  const newContent = fileContent.substring(0, startIndex + startAnchor.length) + "\\n" + chunkToRestore + "\\n                          " + fileContent.substring(endIndex);
  
  // Now let's fix the RIGHT SIDEBAR condition field properly!
  // It should replace the <input ... conditionValue ... /> inside the condition node settings.
  const regexToReplace = /<input\\s*type="text"\\s*value=\\{selectedNode\\.config\\.conditionValue\\}\\s*onChange=\\{\\(e\\) => updateNodeConfig\\(\\{ conditionValue: e\\.target\\.value \\}\\)\\}\\s*placeholder="e\\.g\\. 5000 or COD"\\s*className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"\\s*\\/>/g;
  
  const targetReplacement = \`{selectedNode.config.conditionField === "payment_method" ? (
                      <select
                        value={selectedNode.config.conditionValue || ""}
                        onChange={(e) => updateNodeConfig({ conditionValue: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      >
                        <option value="">Select Method...</option>
                        <option value="COD">Cash on Delivery (COD)</option>
                        <option value="Razorpay">Razorpay (Online)</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedNode.config.conditionValue}
                        onChange={(e) => updateNodeConfig({ conditionValue: e.target.value })}
                        placeholder="e.g. 5000 or COD"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      />
                    )}\`;
  
  const finalContent = newContent.replace(regexToReplace, targetReplacement);
  
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log('Restored chunk successfully.');
} else {
  console.log('Could not find anchors.');
}
