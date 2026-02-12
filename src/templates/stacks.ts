import { layout } from "./layout.js";
import { agentsList } from "./agents.js";
import { servicesList } from "./services.js";
import { escapeHtml } from "./helpers.js";
import type { Agent, Service, Stack } from "./types.js";

// Stack list partial
export function stackList(stacksList: Stack[]): string {
  return `<div id="stacks-table" class="card-grid card-grid-2 fade-in">
    ${stacksList.map(stack => `
      <div class="panel panel-hover">
        <div class="flex items-start justify-between gap-4">
          <div>
            <a href="/stacks/${stack.id}" class="headline text-xl hover:underline">${escapeHtml(stack.name)}</a>
            <p class="subtle mt-2">${stack.description ? escapeHtml(stack.description) : "No description"}</p>
          </div>
          <span class="badge ${stack.securityMode === "blocked"
      ? "badge-green"
      : stack.securityMode === "daemon-port"
        ? "badge-yellow"
        : "badge-gray"
    }">${escapeHtml(stack.securityMode)}</span>
        </div>
        <div class="divider"></div>
        <div class="flex items-center justify-between">
          <a href="/stacks/${stack.id}/edit" class="btn btn-ghost btn-xs">Edit</a>
          <button hx-delete="/api/stacks/${stack.id}"
                  hx-confirm="Are you sure you want to delete this stack?"
                  hx-target="#stacks-table"
                  class="btn btn-danger btn-xs">
            Delete
          </button>
        </div>
      </div>
    `).join("")}
  </div>`;
}

// Empty stacks message
export function emptyStacksMessage(): string {
  return `<div class="panel panel-strong text-center py-12">
    <p class="headline text-2xl">No stacks yet</p>
    <p class="subtle mt-2">Create your first stack to start orchestrating builds.</p>
  </div>`;
}

// Create stack form
export function createStackForm(): string {
  return `<div id="create-stack-modal" class="modal" hx-on::click="if(event.target === this) this.remove()">
    <div class="modal-card">
      <div class="modal-body">
        <div class="modal-title">Create New Stack</div>
        <p class="subtle">Define a workspace for services, agents, and routing.</p>
        <div class="divider"></div>
        <form hx-post="/api/stacks"
              hx-target="#stacks-table-container"
              hx-swap="innerHTML"
              hx-on::after-request="if(event.detail.successful) document.getElementById('create-stack-modal').remove()"
              hx-indicator="#submit-spinner">
          <div class="grid gap-4">
            <div class="field">
              <label class="label" for="stack-name">Name *</label>
              <input type="text" id="stack-name" name="name" required class="input" placeholder="Production control plane">
            </div>
            <div class="field">
              <label class="label" for="stack-description">Description</label>
              <textarea id="stack-description" name="description" rows="3" class="input" placeholder="What does this stack own?"></textarea>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex items-center justify-between">
            <button type="button" onclick="document.getElementById('create-stack-modal').remove()" class="btn btn-ghost">Cancel</button>
            <div class="flex items-center gap-2">
              <div id="submit-spinner" class="htmx-indicator">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <button type="submit" class="btn btn-primary">Create Stack</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

// Dashboard page
export function dashboard(stacksList: Stack[]): string {
  const tableContent = stacksList.length === 0
    ? emptyStacksMessage()
    : stackList(stacksList);

  const content = `<div class="space-y-10">
    <section class="panel panel-strong">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div class="kicker">Control Plane</div>
          <h1 class="headline mt-2">Stacks</h1>
          <p class="subtle mt-2">Design, deploy, and monitor every service footprint in one place.</p>
        </div>
        <button hx-get="/partials/stack-form"
                hx-target="body"
                hx-swap="beforeend"
                class="btn btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Stack
        </button>
      </div>
    </section>
    <section id="stacks-table-container" class="space-y-4">
      ${tableContent}
    </section>
  </div>`;

  return layout(content);
}

// Stack detail page
export function stackDetail(stack: Stack, services: Service[], agents: Agent[]): string {
  const servicesContent = servicesList(services);
  const agentsContent = agentsList(agents);

  const content = `<div class="space-y-10">
    <section class="stack-hero">
      <div class="stack-hero-inner">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div class="kicker">Stack</div>
            <h1 class="stack-hero-title">${escapeHtml(stack.name)}</h1>
          </div>
          <div class="stack-hero-actions">
            <a href="/stacks/${stack.id}/edit" class="btn btn-ghost btn-compact">Edit Stack</a>
            <a href="/" class="btn btn-ghost btn-compact">Back to stacks</a>
          </div>
        </div>
        <div class="stack-hero-meta">
          <span class="stack-chip"><span>Poll</span> ${stack.pollInterval}s</span>
          <span class="stack-chip"><span>Security</span> ${stack.securityMode}</span>
          <span class="stack-chip"><span>Proxy</span> ${stack.externalProxyPort}</span>
        </div>
      </div>
    </section>

    <section class="panel stack-section">
      <div class="section-head">
        <div>
          <div class="section-kicker">Services</div>
          <h2 class="section-title">${services.length} Services</h2>
        </div>
        <a href="/stacks/${stack.id}/services/new" class="btn btn-primary btn-hero">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Service
        </a>
      </div>
      <div id="services-container">
        ${servicesContent}
      </div>
    </section>

    <section class="panel stack-section">
      <div class="section-head">
        <div>
          <div class="section-kicker">Agents</div>
          <h2 class="section-title">${agents.length} Connected Agents</h2>
        </div>
        <button hx-get="/partials/agent-form?stackId=${stack.id}"
                hx-target="body"
                hx-swap="beforeend"
                class="btn btn-primary btn-hero">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Agent
        </button>
      </div>
      <div id="agents-container"
           hx-get="/partials/agents?stackId=${stack.id}"
           hx-trigger="every 5s"
           hx-swap="innerHTML">
        ${agentsContent}
      </div>
    </section>
  </div>`;

  return layout(content, stack.name);
}

// Edit stack page
export function editStackPage(stack: Stack): string {
  const content = `<div id="stack-edit-page" class="service-page">
    <section class="panel panel-strong">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div class="kicker">Stack</div>
          <h1 class="headline mt-2">Edit ${escapeHtml(stack.name)}</h1>
          <p class="subtle mt-2">Update stack identity and control-plane settings.</p>
        </div>
        <a href="/stacks/${stack.id}" class="btn btn-ghost">Back to stack</a>
      </div>
    </section>

    <section class="panel service-form-panel">
      <form id="stack-edit-form"
            action="/api/stacks/${stack.id}"
            method="post"
            hx-patch="/api/stacks/${stack.id}"
            hx-target="#stack-edit-feedback"
            hx-swap="innerHTML"
            hx-on::after-request="if(event.detail.successful) window.location = '/stacks/${stack.id}'"
            hx-on::response-error="const target = document.getElementById('stack-edit-feedback'); if (target) target.textContent = event.detail.xhr.responseText || 'Request failed';"
            hx-indicator="#submit-spinner"
            class="space-y-8">
        <div id="stack-edit-feedback"></div>
        <div class="service-form-grid">
          <div class="service-column">
            <div class="service-section">
              <div class="service-section-header">
                <h3>Identity</h3>
                <p>Set a clear name and optional description.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="edit-stack-name">Stack Name *</label>
                  <input type="text" id="edit-stack-name" name="name" required value="${escapeHtml(stack.name)}" class="input">
                </div>
                <div class="field span-2">
                  <label class="label" for="edit-stack-description">Description</label>
                  <textarea id="edit-stack-description" name="description" rows="4" class="input">${escapeHtml(stack.description || "")}</textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="service-column">
            <div class="service-section">
              <div class="service-section-header">
                <h3>Control Plane</h3>
                <p>Tune poll, heartbeat, and proxy behavior for this stack.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="edit-stack-poll-interval">Poll Interval (sec)</label>
                  <input type="number" id="edit-stack-poll-interval" name="poll_interval" value="${stack.pollInterval}" min="5" max="600" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-stack-heartbeat-interval">Heartbeat Interval (sec)</label>
                  <input type="number" id="edit-stack-heartbeat-interval" name="heartbeat_interval" value="${stack.heartbeatInterval}" min="30" max="300" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-stack-security-mode">Security Mode</label>
                  <select id="edit-stack-security-mode" name="security_mode" class="input">
                    <option value="none" ${stack.securityMode === "none" ? "selected" : ""}>none</option>
                    <option value="daemon-port" ${stack.securityMode === "daemon-port" ? "selected" : ""}>daemon-port</option>
                    <option value="blocked" ${stack.securityMode === "blocked" ? "selected" : ""}>blocked</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label" for="edit-stack-external-port">External Proxy Port</label>
                  <input type="number" id="edit-stack-external-port" name="external_proxy_port" value="${stack.externalProxyPort}" min="1" max="65535" class="input">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="flex items-center justify-between">
          <a href="/stacks/${stack.id}" class="btn btn-ghost">Cancel</a>
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

  return layout(content, `Edit Stack - ${escapeHtml(stack.name)}`);
}
