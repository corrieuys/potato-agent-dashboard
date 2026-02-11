import { layout } from "./layout.js";
import { escapeHtml, getHealthChipClass, getStatusChipClass } from "./helpers.js";
import type { Service, Stack } from "./types.js";

// Create service page
export function createServicePage(stack: Stack): string {
  const content = `<div id="service-create-page" class="service-page">
    <section class="panel panel-strong">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div class="kicker">Stack: ${escapeHtml(stack.name)}</div>
          <h1 class="headline mt-2">Create Service</h1>
          <p class="subtle mt-2">Define the repo, language, and routing for auto-built Docker images.</p>
        </div>
        <a href="/stacks/${stack.id}" class="btn btn-ghost">Back to stack</a>
      </div>
    </section>

    <section class="panel service-form-panel">
      <form id="service-create-form"
            action="/api/stacks/${stack.id}/services"
            method="post"
            hx-post="/api/stacks/${stack.id}/services"
            hx-target="#service-create-feedback"
            hx-swap="innerHTML"
            hx-on::after-request="if(event.detail.successful) window.location = '/stacks/${stack.id}'"
            hx-on::response-error="const target = document.getElementById('service-create-feedback'); if (target) target.textContent = event.detail.xhr.responseText || 'Request failed';"
            hx-indicator="#submit-spinner"
            class="space-y-8">
        <div id="service-create-feedback"></div>
        <div class="service-form-grid">
          <div class="service-column">
            <div class="service-section">
              <div class="service-section-header">
                <h3>Identity</h3>
                <p>Name it and decide how it is exposed.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="service-name">Service Name *</label>
                  <input type="text" id="service-name" name="name" required placeholder="api-service" class="input">
                </div>
                <div class="field">
                  <label class="label" for="service-external-path">External Path</label>
                  <input type="text" id="service-external-path" name="external_path" placeholder="/api" class="input">
                </div>
              </div>
            </div>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Repository</h3>
                <p>Connect the source and optional SSH settings.</p>
              </div>
              <div class="service-field-row">
                <div class="field span-2">
                  <label class="label" for="service-git-url">Git Repository URL *</label>
                  <input type="url" id="service-git-url" name="git_url" required placeholder="https://github.com/user/repo.git" class="input">
                </div>
                <div class="field">
                  <label class="label" for="service-git-ref">Git Reference</label>
                  <input type="text" id="service-git-ref" name="git_ref" value="main" class="input">
                </div>
                <div class="field">
                  <label class="label" for="service-git-commit">Pin Commit</label>
                  <input type="text" id="service-git-commit" name="git_commit" placeholder="abc123" class="input">
                </div>
                <div class="field span-2">
                  <label class="label" for="service-git-ssh-key">SSH Key Name</label>
                  <input type="text" id="service-git-ssh-key" name="git_ssh_key" placeholder="default" class="input">
                  <p class="subtle text-xs">Use when the repo is private and the agent has a matching key.</p>
                </div>
              </div>
            </div>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Build & Run</h3>
                <p>Provide the exact commands to build and start your app.</p>
              </div>
              <div class="service-field-row">
                <div class="field span-2">
                  <label class="label" for="service-build-command">Build Command *</label>
                  <input type="text" id="service-build-command" name="build_command" required placeholder="npm run build" class="input">
                </div>
                <div class="field span-2">
                  <label class="label" for="service-run-command">Run Command *</label>
                  <input type="text" id="service-run-command" name="run_command" required placeholder="npm start" class="input">
                </div>
              </div>
            </div>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Runtime</h3>
                <p>Docker builds are automatic. Pick a language or let it auto-detect.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="service-language">Language</label>
                  <select id="service-language" name="language" class="input">
                    <option value="auto" selected>auto</option>
                    <option value="nodejs">nodejs</option>
                    <option value="golang">golang</option>
                    <option value="python">python</option>
                    <option value="rust">rust</option>
                    <option value="java">java</option>
                    <option value="generic">generic</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label" for="service-base-image">Base Image (optional)</label>
                  <input type="text" id="service-base-image" name="base_image" placeholder="node:20-alpine" class="input">
                </div>
                <div class="field">
                  <label class="label" for="service-port">App Port *</label>
                  <input type="number" id="service-port" name="port" required value="8000" min="1" max="65535" class="input">
                </div>
                <div class="field">
                  <label class="label" for="service-health-path">Health Check Path</label>
                  <input type="text" id="service-health-path" name="health_check_path" value="/health" class="input">
                </div>
                <div class="field">
                  <label class="label" for="service-health-interval">Health Interval (sec)</label>
                  <input type="number" id="service-health-interval" name="health_check_interval" value="30" min="5" max="600" class="input">
                </div>
              </div>
            </div>

            <details class="service-section">
              <summary class="service-section-summary">Advanced Docker Options</summary>
              <div class="service-section-body">
                <div class="service-section-header">
                  <h3>Docker</h3>
                  <p>Optional overrides for Docker build and runtime.</p>
                </div>
                <div class="service-field-row">
                  <div class="field">
                    <label class="label" for="service-runtime">Runtime</label>
                    <input type="text" id="service-runtime" name="runtime" placeholder="docker" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="service-dockerfile-path">Dockerfile Path</label>
                    <input type="text" id="service-dockerfile-path" name="dockerfile_path" placeholder="Dockerfile" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="service-docker-context">Docker Context</label>
                    <input type="text" id="service-docker-context" name="docker_context" placeholder="." class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="service-docker-container-port">Container Port</label>
                    <input type="number" id="service-docker-container-port" name="docker_container_port" min="1" max="65535" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="service-image-retain-count">Image Retain Count</label>
                    <input type="number" id="service-image-retain-count" name="image_retain_count" min="1" max="100" class="input">
                  </div>
                </div>
              </div>
            </details>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Environment</h3>
                <p>Optional JSON for non-secret environment variables.</p>
              </div>
              <div class="service-field-row">
                <div class="field span-2">
                  <label class="label" for="service-environment-vars">Environment Variables</label>
                  <textarea id="service-environment-vars" name="environment_vars" rows="5" class="input" placeholder='{"NODE_ENV":"production"}'></textarea>
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
            <button type="submit" class="btn btn-primary">Create Service</button>
          </div>
        </div>
      </form>
    </section>

    <style>
      .service-page {
        display: grid;
        gap: 32px;
      }
      .service-form-panel {
        width: 100%;
      }
      .service-form-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: 1fr;
      }
      .service-column {
        display: grid;
        gap: 20px;
        width: 100%;
        grid-column: 1 / -1;
      }
      .service-section {
        border: 1px solid var(--panel-border);
        background: var(--panel-strong);
        border-radius: var(--radius-md);
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .service-section-header h3 {
        margin: 0;
        font-size: 1.05rem;
      }
      .service-section-header p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .service-section-summary {
        cursor: pointer;
        font-weight: 600;
        list-style: none;
      }
      .service-section-summary::-webkit-details-marker { display: none; }
      .service-section-body { margin-top: 12px; display: grid; gap: 14px; }
      .service-field-row {
        display: grid;
        gap: 12px;
      }
      .service-field-row .span-2 { grid-column: span 2; }
      @media (min-width: 768px) {
        .service-field-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (min-width: 1024px) {
        .service-form-grid { grid-template-columns: 1fr; }
      }
    </style>

  </div>`;

  return layout(content, `Add Service - ${escapeHtml(stack.name)}`);
}

// Services list partial
export function servicesList(services: Service[]): string {
  if (!services || services.length === 0) {
    return `<div class="panel panel-strong text-center py-10">
      <p class="headline text-xl">No services yet</p>
      <p class="subtle mt-2">Add a service to begin builds and routing.</p>
    </div>`;
  }

  return `<div class="card-grid">${services.map(s => `
    <div class="service-card">
      <div class="service-header">
        <div>
          <div class="service-title-row">
            <h4 class="service-title">${escapeHtml(s.name)}</h4>
            ${s.externalPath ? `<span class="service-path">${escapeHtml(s.externalPath)}</span>` : ""}
          </div>
          <div class="service-meta mono">${escapeHtml(s.gitUrl)}</div>
        </div>
        <div class="service-actions">
          <a href="/stacks/${s.stackId}/services/${s.id}/edit" class="btn btn-ghost btn-compact">Edit</a>
          <button hx-delete="/api/stacks/${s.stackId}/services/${s.id}"
            hx-confirm="Are you sure you want to delete this service?"
            hx-target="#services-container"
            class="btn btn-danger btn-compact">Delete</button>
        </div>
      </div>
      <div class="service-divider"></div>
      <div class="service-rail">
        <div class="flex flex-wrap gap-2">
          <span class="chip ${getStatusChipClass(s.runtimeStatus)}">${escapeHtml(s.runtimeStatus || "unknown")}</span>
          ${s.healthStatus && s.healthStatus !== "unknown" ? `<span class="chip ${getHealthChipClass(s.healthStatus)}">${escapeHtml(s.healthStatus)}</span>` : ""}
        </div>
        ${s.agentName ? `<div class="subtle text-xs">Last seen on ${escapeHtml(s.agentName)}</div>` : ""}
      </div>
    </div>
  `).join("")}</div>`;
}

// Edit service page
export function editServicePage(stack: Stack, service: Service): string {
  const environmentVarsValue = service.environmentVars
    ? (typeof service.environmentVars === "string"
      ? service.environmentVars
      : JSON.stringify(service.environmentVars, null, 2))
    : "";

  const content = `<div id="service-edit-page" class="service-page">
    <section class="panel panel-strong">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div class="kicker">Stack: ${escapeHtml(stack.name)}</div>
          <h1 class="headline mt-2">Edit ${escapeHtml(service.name)}</h1>
          <p class="subtle mt-2">Update the repo, language, and routing details.</p>
        </div>
        <a href="/stacks/${stack.id}" class="btn btn-ghost">Back to stack</a>
      </div>
    </section>

    <section class="panel service-form-panel">
      <form id="service-edit-form"
            action="/api/stacks/${stack.id}/services/${service.id}"
            method="post"
            hx-patch="/api/stacks/${stack.id}/services/${service.id}"
            hx-target="#service-edit-feedback"
            hx-swap="innerHTML"
            hx-on::after-request="if(event.detail.successful) window.location = '/stacks/${stack.id}'"
            hx-on::response-error="const target = document.getElementById('service-edit-feedback'); if (target) target.textContent = event.detail.xhr.responseText || 'Request failed';"
            hx-indicator="#submit-spinner"
            class="space-y-8">
        <div id="service-edit-feedback"></div>
        <div class="service-form-grid">
          <div class="service-column">
            <div class="service-section">
              <div class="service-section-header">
                <h3>Identity</h3>
                <p>Name it and decide how it is exposed.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="edit-service-name">Service Name *</label>
                  <input type="text" id="edit-service-name" name="name" required value="${escapeHtml(service.name)}" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-service-external-path">External Path</label>
                  <input type="text" id="edit-service-external-path" name="external_path" value="${escapeHtml(service.externalPath || "")}" class="input">
                </div>
              </div>
            </div>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Repository</h3>
                <p>Source settings and optional pinning.</p>
              </div>
              <div class="service-field-row">
                <div class="field span-2">
                  <label class="label" for="edit-service-git-url">Git Repository URL *</label>
                  <input type="url" id="edit-service-git-url" name="git_url" required value="${escapeHtml(service.gitUrl)}" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-service-git-ref">Git Reference</label>
                  <input type="text" id="edit-service-git-ref" name="git_ref" value="${escapeHtml(service.gitRef || "main")}" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-service-git-commit">Pin Commit</label>
                  <input type="text" id="edit-service-git-commit" name="git_commit" value="${escapeHtml(service.gitCommit || "")}" class="input">
                </div>
                <div class="field span-2">
                  <label class="label" for="edit-service-git-ssh-key">SSH Key Name</label>
                  <input type="text" id="edit-service-git-ssh-key" name="git_ssh_key" value="${escapeHtml(service.gitSshKey || "")}" class="input">
                  <p class="subtle text-xs">Required only for private repositories.</p>
                </div>
              </div>
            </div>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Build & Run</h3>
                <p>Provide the exact commands to build and start your app.</p>
              </div>
              <div class="service-field-row">
                <div class="field span-2">
                  <label class="label" for="edit-service-build-command">Build Command *</label>
                  <input type="text" id="edit-service-build-command" name="build_command" required value="${escapeHtml(service.buildCommand)}" class="input">
                </div>
                <div class="field span-2">
                  <label class="label" for="edit-service-run-command">Run Command *</label>
                  <input type="text" id="edit-service-run-command" name="run_command" required value="${escapeHtml(service.runCommand)}" class="input">
                </div>
              </div>
            </div>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Runtime</h3>
                <p>Docker builds are automatic. Pick a language or let it auto-detect.</p>
              </div>
              <div class="service-field-row">
                <div class="field">
                  <label class="label" for="edit-service-language">Language</label>
                  <select id="edit-service-language" name="language" class="input">
                    <option value="auto" ${service.language === "auto" ? "selected" : ""}>auto</option>
                    <option value="nodejs" ${service.language === "nodejs" ? "selected" : ""}>nodejs</option>
                    <option value="golang" ${service.language === "golang" ? "selected" : ""}>golang</option>
                    <option value="python" ${service.language === "python" ? "selected" : ""}>python</option>
                    <option value="rust" ${service.language === "rust" ? "selected" : ""}>rust</option>
                    <option value="java" ${service.language === "java" ? "selected" : ""}>java</option>
                    <option value="generic" ${service.language === "generic" ? "selected" : ""}>generic</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label" for="edit-service-base-image">Base Image (optional)</label>
                  <input type="text" id="edit-service-base-image" name="base_image" value="${escapeHtml(service.baseImage || "")}" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-service-port">App Port *</label>
                  <input type="number" id="edit-service-port" name="port" required value="${service.port}" min="1" max="65535" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-service-health-path">Health Check Path</label>
                  <input type="text" id="edit-service-health-path" name="health_check_path" value="${escapeHtml(service.healthCheckPath || "/health")}" class="input">
                </div>
                <div class="field">
                  <label class="label" for="edit-service-health-interval">Health Interval (sec)</label>
                  <input type="number" id="edit-service-health-interval" name="health_check_interval" value="${service.healthCheckInterval || 30}" min="5" max="600" class="input">
                </div>
              </div>
            </div>

            <details class="service-section">
              <summary class="service-section-summary">Advanced Docker Options</summary>
              <div class="service-section-body">
                <div class="service-section-header">
                  <h3>Docker</h3>
                  <p>Optional overrides for Docker build and runtime.</p>
                </div>
                <div class="service-field-row">
                  <div class="field">
                    <label class="label" for="edit-service-runtime">Runtime</label>
                    <input type="text" id="edit-service-runtime" name="runtime" value="${escapeHtml(service.runtime || "")}" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="edit-service-dockerfile-path">Dockerfile Path</label>
                    <input type="text" id="edit-service-dockerfile-path" name="dockerfile_path" value="${escapeHtml(service.dockerfilePath || "")}" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="edit-service-docker-context">Docker Context</label>
                    <input type="text" id="edit-service-docker-context" name="docker_context" value="${escapeHtml(service.dockerContext || "")}" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="edit-service-docker-container-port">Container Port</label>
                    <input type="number" id="edit-service-docker-container-port" name="docker_container_port" value="${service.dockerContainerPort || ""}" min="1" max="65535" class="input">
                  </div>
                  <div class="field">
                    <label class="label" for="edit-service-image-retain-count">Image Retain Count</label>
                    <input type="number" id="edit-service-image-retain-count" name="image_retain_count" value="${service.imageRetainCount || ""}" min="1" max="100" class="input">
                  </div>
                </div>
              </div>
            </details>

            <div class="service-section">
              <div class="service-section-header">
                <h3>Environment</h3>
                <p>JSON for non-secret environment variables.</p>
              </div>
              <div class="service-field-row">
                <div class="field span-2">
                  <label class="label" for="edit-service-environment-vars">Environment Variables</label>
                  <textarea id="edit-service-environment-vars" name="environment_vars" rows="5" class="input">${escapeHtml(environmentVarsValue)}</textarea>
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

    <style>
      .service-page {
        display: grid;
        gap: 32px;
      }
      .service-form-panel {
        width: 100%;
      }
      .service-form-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: 1fr;
      }
      .service-column {
        display: grid;
        gap: 20px;
        width: 100%;
        grid-column: 1 / -1;
      }
      .service-section {
        border: 1px solid var(--panel-border);
        background: var(--panel-strong);
        border-radius: var(--radius-md);
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .service-section-header h3 {
        margin: 0;
        font-size: 1.05rem;
      }
      .service-section-header p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .service-section-summary {
        cursor: pointer;
        font-weight: 600;
        list-style: none;
      }
      .service-section-summary::-webkit-details-marker { display: none; }
      .service-section-body { margin-top: 12px; display: grid; gap: 14px; }
      .service-field-row {
        display: grid;
        gap: 12px;
      }
      .service-field-row .span-2 { grid-column: span 2; }
      @media (min-width: 768px) {
        .service-field-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (min-width: 1024px) {
        .service-form-grid { grid-template-columns: 1fr; }
      }
    </style>

  </div>`;

  return layout(content, `Edit Service - ${escapeHtml(stack.name)}`);
}
