const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', '(admin)', 'admin', 'workflows', 'create', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update TRIGGER_TYPES
content = content.replace(
`  { id: "CART_ABANDONED", label: "When Cart is Abandoned" }`,
`  { id: "CART_ABANDONED", label: "When Cart is Abandoned" },
  { id: "payment_success", label: "When Payment Succeeds" },
  { id: "payment_failed", label: "When Payment Fails" }`
);

// 2. Update CONDITION_FIELDS to add for payment
content = content.replace(
`const CONDITION_FIELDS = {`,
`const CONDITION_FIELDS = {
  "payment_success": [
    { id: "total", label: "Payment Total (₹)" },
    { id: "payment_method", label: "Payment Method" }
  ],
  "payment_failed": [
    { id: "total", label: "Payment Total (₹)" },
    { id: "payment_method", label: "Payment Method" }
  ],`
);

// 3. Update TEMPLATE_PAYLOADS
content = content.replace(
`const TEMPLATE_PAYLOADS = {`,
`const TEMPLATE_PAYLOADS = {
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
  ],`
);

// 4. Update Left Toolbar Buttons
const toolbarRegex = /<button[\s\S]*?Action Node[\s\S]*?<\/button>/;
const toolbarMatch = content.match(toolbarRegex);
if (toolbarMatch) {
  content = content.replace(toolbarMatch[0], toolbarMatch[0] + `
                <button
                  onClick={() => {
                    const id = \`node-wait-\${Date.now()}\`
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
                </button>`);
}

// 5. Update Action Node Types dropdown
content = content.replace(
`<option value="add_customer_tag">Add Customer Tag</option>`,
`<option value="add_customer_tag">Add Customer Tag</option>
                      <option value="wait">Wait / Delay (Pause execution)</option>
                      <option value="add_to_google_sheet">Append to Google Sheets</option>
                      <option value="sms">Send Mobile SMS</option>`
);

// 6. Update Action Details Switcher (Email Custom Field)
content = content.replace(
`<option value="admin">Store Admin Email (harshitmah99@gmail.com)</option>
                        </select>`,
`<option value="admin">Store Admin Email (harshitmah99@gmail.com)</option>
                          <option value="custom">Custom Email Address</option>
                        </select>
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
                        )}`
);

// 7. Update Condition Dropdown for Payment Method
const condValueRegex = /<input[\s\S]*?conditionValue[\s\S]*?\/>/;
const condValueMatch = content.match(condValueRegex);
if (condValueMatch) {
  content = content.replace(condValueMatch[0], `
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
                    ) : (
                      <input
                        type="text"
                        value={selectedNode.config.conditionValue}
                        onChange={(e) => updateNodeConfig({ conditionValue: e.target.value })}
                        placeholder="e.g. 5000 or COD"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none"
                      />
                    )}
  `);
}

// 8. Add Config Panels for Wait, Google Sheets, SMS
const timelineConfigStr = `{selectedNode.config.actionType === "add_customer_tag"`;
content = content.replace(timelineConfigStr, `
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
                      <p className="text-[10px] text-zinc-500 mt-1">Example: 5000 = 5 seconds. High delays are mocked in this MVP version.</p>
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
                          placeholder="e.g. {customer_phone} or +919876543210"
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

                  ${timelineConfigStr}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('UI updated successfully.');
