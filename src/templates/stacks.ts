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
          <span></span>
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
    <section class="panel panel-strong" style="padding: 16px 20px;">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="headline" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">${escapeHtml(stack.name)}</h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a href="/stacks" class="btn btn-ghost btn-xs">Back to stacks</a>
          <span class="chip chip-muted">Poll ${stack.pollInterval}s</span>
          <span class="chip chip-muted">${stack.securityMode}</span>
          <span class="chip chip-muted">Proxy ${stack.externalProxyPort}</span>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <div class="kicker">Services</div>
          <h2 class="headline text-2xl">${services.length} Active Services</h2>
        </div>
        <a href="/stacks/${stack.id}/services/new" class="btn btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Service
        </a>
      </div>
      <div id="services-container" class="mt-6">
        ${servicesContent}
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <div class="kicker">Agents</div>
          <h2 class="headline text-2xl">${agents.length} Connected Agents</h2>
        </div>
        <button hx-get="/partials/agent-form?stackId=${stack.id}"
                hx-target="body"
                hx-swap="beforeend"
                class="btn btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Agent
        </button>
      </div>
      <div id="agents-container" class="mt-6">
        ${agentsContent}
      </div>
    </section>
  </div>`;

  return layout(content, stack.name);
}
