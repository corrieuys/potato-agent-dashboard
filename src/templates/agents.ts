import { layout } from "./layout.js";
import { escapeHtml, getHealthChipClass, getStatusChipClass } from "./helpers.js";
import type { Agent } from "./types.js";

// Create agent form (for setup command generation)
export function createAgentForm(stackId: string, installCommand: string): string {
  return `<div id="create-agent-token-modal" class="modal" hx-on::click="if(event.target === this) this.remove()">
    <div class="modal-card">
      <div class="modal-body">
        <div class="modal-title">Add New Agent</div>
        <p class="subtle">Install this agent on the server to link it to your stack.</p>
        <div class="divider"></div>
        <div class="panel panel-strong" style="padding: 18px;">
          <p class="chip" style="margin-bottom: 10px;">Setup command generated</p>
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
        <p class="subtle">Name it for quick recognition, then generate a setup command.</p>
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
              <button type="submit" class="btn btn-primary">Generate Command</button>
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
      <p class="subtle mt-2">Add an agent to start syncing desired state.</p>
    </div>`;
  }

  return `<div class="card-grid">${agents.map(a => `
    <div class="panel panel-hover">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 class="headline text-xl">${escapeHtml(a.name || "Unnamed Agent")}</h4>
          <div class="subtle text-xs mono mt-1">ID: ${escapeHtml(a.id)}</div>
          <p class="subtle mt-2">Latest heartbeat: ${formatHeartbeatTimestamp(a.latestHeartbeatCreatedAt)}</p>
          ${a.heartbeatStackVersion !== undefined && a.heartbeatStackVersion !== null
      ? `<p class="subtle text-xs mt-1">Stack version: ${a.heartbeatStackVersion}</p>`
      : ""
    }
        </div>
        <div class="flex items-center gap-2">
          <a href="/stacks/${a.stackId}/agents/${a.id}/edit" class="btn btn-ghost btn-compact">Edit</a>
          <button hx-delete="/api/stacks/${a.stackId}/agents/${a.id}"
                  hx-confirm="Are you sure you want to delete this agent?"
                  hx-target="#agents-container"
                  class="btn btn-danger btn-compact">
            Delete
          </button>
          ${(() => {
            const state = getConnectionState(a.latestHeartbeatCreatedAt);
            return `<span class="badge ${state.badgeClass}">${escapeHtml(state.text)}</span>`;
          })()}
          ${a.heartbeatAgentStatus
      ? `<span class="chip ${getStatusChipClass(a.heartbeatAgentStatus)}">${escapeHtml(a.heartbeatAgentStatus)}</span>`
      : ""
    }
        </div>
      </div>
      <div class="divider"></div>
      ${renderAgentServicesStatus(a)}
    </div>
  `).join("")}</div>`;
}

function formatHeartbeatTimestamp(value: Date | string | number | null | undefined): string {
  if (!value) {
    return "Never connected";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Never connected" : value.toLocaleString();
  }

  if (typeof value === "number") {
    const millis = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? "Never connected" : date.toLocaleString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Never connected";
    }

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) {
      const millis = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
      const numericDate = new Date(millis);
      if (!Number.isNaN(numericDate.getTime())) {
        return numericDate.toLocaleString();
      }
    }

    let date = new Date(trimmed);
    if (Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      date = new Date(trimmed.replace(" ", "T") + "Z");
    }

    return Number.isNaN(date.getTime()) ? "Never connected" : date.toLocaleString();
  }

  return "Never connected";
}

function getConnectionState(lastHeartbeatAt: number | null | undefined): { text: string; badgeClass: string } {
  if (!lastHeartbeatAt) {
    return { text: "Never connected", badgeClass: "badge-gray" };
  }

  const secondsAgo = (Date.now() - lastHeartbeatAt) / 1000;

  if (secondsAgo < 90) {
    return { text: "Online", badgeClass: "badge-green" };
  }

  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) {
    return { text: `Disconnected (${minutes}m ago)`, badgeClass: "badge-red" };
  }

  const hours = Math.floor(minutes / 60);
  return { text: `Disconnected (${hours}h ago)`, badgeClass: "badge-red" };
}

function renderAgentServicesStatus(agent: Agent): string {
  const statuses = agent.serviceStatuses || [];
  if (statuses.length === 0) {
    return `<div class="subtle text-xs">No service status data in latest heartbeat.</div>`;
  }

  return `<div class="space-y-2">
    <div class="subtle text-xs">Services from latest heartbeat at ${escapeHtml(formatHeartbeatTimestamp(agent.latestHeartbeatCreatedAt))}</div>
    <div class="space-y-2">
      ${statuses.map((svc) => {
        const hasError = svc.lastError && svc.lastError.trim();
        return `
        <div class="panel panel-strong" style="padding: 10px 12px;">
          <div class="flex items-center justify-between gap-2">
            <div class="headline text-sm">${escapeHtml(svc.name || svc.serviceId)}</div>
            <div class="flex flex-wrap gap-2">
              <span class="chip ${getStatusChipClass(svc.status)}">${escapeHtml(svc.status || "unknown")}</span>
              ${svc.healthStatus && svc.healthStatus !== "unknown"
            ? `<span class="chip ${getHealthChipClass(svc.healthStatus)}">${escapeHtml(svc.healthStatus)}</span>`
            : ""
          }
            </div>
          </div>
          ${hasError ? `
            <div class="mt-2">
              <button onclick="const el = this.nextElementSibling; el.classList.toggle('hidden'); this.textContent = el.classList.contains('hidden') ? 'Show error' : 'Hide error';"
                      class="text-xs text-red-600 hover:text-red-800 underline cursor-pointer">
                Show error
              </button>
              <div class="hidden mt-2 p-2 bg-red-50 text-red-800 text-xs font-mono rounded border border-red-200">
                ${escapeHtml(svc.lastError)}
              </div>
            </div>
          ` : ""}
        </div>
      `}).join("")}
    </div>
  </div>`;
}

export function editAgentPage(stackId: string, agent: Agent): string {
  const content = `<div id="agent-edit-page" class="service-page">
    <section class="panel panel-strong">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div class="kicker">Agent</div>
          <h1 class="headline mt-2">Edit ${escapeHtml(agent.name || "Unnamed Agent")}</h1>
          <p class="subtle mt-2">Update the display name shown across stack status cards.</p>
        </div>
        <a href="/stacks/${stackId}" class="btn btn-ghost">Back to stack</a>
      </div>
    </section>

    <section class="panel service-form-panel">
      <form id="agent-edit-form"
            action="/api/stacks/${stackId}/agents/${agent.id}"
            method="post"
            hx-patch="/api/stacks/${stackId}/agents/${agent.id}"
            hx-target="#agent-edit-feedback"
            hx-swap="innerHTML"
            hx-on::after-request="if(event.detail.successful) window.location = '/stacks/${stackId}'"
            hx-on::response-error="const target = document.getElementById('agent-edit-feedback'); if (target) target.textContent = event.detail.xhr.responseText || 'Request failed';"
            hx-indicator="#submit-spinner"
            class="space-y-8">
        <div id="agent-edit-feedback"></div>
        <div class="service-form-grid">
          <div class="service-column">
            <div class="service-section">
              <div class="service-section-header">
                <h3>Identity</h3>
                <p>Only the display name is editable for agents.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="edit-agent-name-page">Agent Name</label>
                  <input type="text" id="edit-agent-name-page" name="name" value="${escapeHtml(agent.name || "")}" placeholder="production-server-01" class="input">
                </div>
              </div>
            </div>
          </div>
          <div class="service-column">
            <div class="service-section">
              <div class="service-section-header">
                <h3>Details</h3>
                <p>Read-only identifiers and heartbeat information.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label">Agent ID</label>
                  <input type="text" value="${escapeHtml(agent.id)}" class="input" disabled>
                </div>
                <div class="field">
                  <label class="label">Last Heartbeat</label>
                  <input type="text" value="${escapeHtml(formatHeartbeatTimestamp(agent.latestHeartbeatCreatedAt))}" class="input" disabled>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="flex items-center justify-between">
          <a href="/stacks/${stackId}" class="btn btn-ghost">Cancel</a>
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
    </section>
  </div>`;

  return layout(content, `Edit Agent - ${escapeHtml(agent.name || "Unnamed Agent")}`);
}
