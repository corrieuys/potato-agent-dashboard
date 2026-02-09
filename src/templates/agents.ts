import { escapeHtml } from "./helpers.js";
import type { Agent } from "./types.js";

// Create agent form (for install token generation)
export function createAgentForm(stackId: string, installToken: string, installCommand: string): string {
  return `<div id="create-agent-token-modal" class="modal" hx-on::click="if(event.target === this) this.remove()">
    <div class="modal-card">
      <div class="modal-body">
        <div class="modal-title">Add New Agent</div>
        <p class="subtle">Install this agent on the server to link it to your stack.</p>
        <div class="divider"></div>
        <div class="panel panel-strong" style="padding: 18px;">
          <p class="chip" style="margin-bottom: 10px;">Token generated</p>
          <p class="subtle text-sm">Run this command on your Linux server:</p>
          <code class="block mono" style="margin-top: 10px; padding: 14px; border-radius: 12px; background: rgba(15, 23, 42, 0.9); color: #d1fae5; font-size: 0.78rem; overflow-x: auto;">
            ${escapeHtml(installCommand)}
          </code>
        </div>
        <div class="divider"></div>
        <div class="flex items-center justify-between">
          <button type="button" onclick="document.getElementById('create-agent-token-modal').remove()" class="btn btn-ghost">Close</button>
          <button type="button" onclick="navigator.clipboard.writeText('${escapeHtml(installCommand)}'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy Command', 2000)" class="btn btn-primary">
            Copy Command
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

// Agent form initial (just name input)
export function agentNameForm(stackId: string): string {
  return `<div id="create-agent-modal" class="modal" hx-on::click="if(event.target === this) this.remove()">
    <div class="modal-card">
      <div class="modal-body">
        <div class="modal-title">Add New Agent</div>
        <p class="subtle">Name it for quick recognition, then generate a one-time token.</p>
        <div class="divider"></div>
        <div id="agent-create-feedback"></div>
          <form hx-post="/api/stacks/${stackId}/agents/tokens"
              hx-target="body"
              hx-swap="beforeend"
            hx-on::after-request="if(event.detail.successful) { const modal = document.getElementById('create-agent-modal'); if(modal) modal.remove(); if (window.htmx) { window.htmx.ajax('GET', '/partials/agents?stackId=${stackId}', { target: '#agents-container', swap: 'innerHTML' }); } }"
              hx-on::response-error="const target = document.getElementById('agent-create-feedback'); if (target) target.textContent = event.detail.xhr.responseText || 'Request failed';"
              hx-indicator="#submit-spinner">
          <div class="field">
            <label class="label" for="agent-name">Agent Name (optional)</label>
            <input type="text" id="agent-name" name="name" placeholder="production-server-01" class="input">
          </div>
          <div class="divider"></div>
          <div class="flex items-center justify-between">
            <button type="button" onclick="document.getElementById('create-agent-modal').remove()" class="btn btn-ghost">Cancel</button>
            <div class="flex items-center gap-2">
              <div id="submit-spinner" class="htmx-indicator">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <button type="submit" class="btn btn-primary">Generate Token</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

// Agents list partial
export function agentsList(agents: Agent[]): string {
  if (!agents || agents.length === 0) {
    return `<div class="panel panel-strong text-center py-10">
      <p class="headline text-xl">No agents yet</p>
      <p class="subtle mt-2">Register an agent to start syncing desired state.</p>
    </div>`;
  }

  return `<div class="card-grid">${agents.map(a => `
    <div class="panel panel-hover">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 class="headline text-xl">${escapeHtml(a.name || "Unnamed Agent")}</h4>
          <p class="subtle mt-2">${a.lastHeartbeatAt ? new Date(a.lastHeartbeatAt).toLocaleString() : "Never connected"}</p>
        </div>
        <div class="flex items-center gap-2">
          <button hx-get="/partials/agent-edit-form?stackId=${a.stackId}&agentId=${a.id}"
                  hx-target="body"
                  hx-swap="beforeend"
                  class="btn btn-ghost btn-xs">
            Edit
          </button>
          <button hx-delete="/api/stacks/${a.stackId}/agents/${a.id}"
                  hx-confirm="Are you sure you want to delete this agent?"
                  hx-target="#agents-container"
                  class="btn btn-danger btn-xs">
            Delete
          </button>
          <span class="badge ${a.status === "online"
      ? "badge-green"
      : a.status === "pending"
        ? "badge-yellow"
        : "badge-gray"
    }">${escapeHtml(a.status || "Unknown")}</span>
        </div>
      </div>
    </div>
  `).join("")}</div>`;
}

// Edit agent form
export function editAgentForm(stackId: string, agent: Agent): string {
  return `<div id="edit-agent-modal" class="modal" hx-on::click="if(event.target === this) this.remove()">
    <div class="modal-card">
      <div class="modal-body">
        <div class="modal-title">Edit Agent</div>
        <p class="subtle">Update the agent label used in the dashboard.</p>
        <div class="divider"></div>
        <form hx-patch="/api/stacks/${stackId}/agents/${agent.id}"
              hx-target="#agents-container"
              hx-swap="innerHTML"
              hx-on::after-request="if(event.detail.successful) document.getElementById('edit-agent-modal').remove()"
              hx-indicator="#submit-spinner">
          <div class="field">
            <label class="label" for="edit-agent-name">Agent Name</label>
            <input type="text" id="edit-agent-name" name="name" value="${escapeHtml(agent.name || "")}" placeholder="production-server-01" class="input">
          </div>
          <div class="divider"></div>
          <div class="flex items-center justify-between">
            <button type="button" onclick="document.getElementById('edit-agent-modal').remove()" class="btn btn-ghost">Cancel</button>
            <div class="flex items-center gap-2">
              <div id="submit-spinner" class="htmx-indicator">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}
