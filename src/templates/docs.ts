import { layout } from "./layout.js";

// Documentation page
export function docsPage(): string {
  const content = `
  <div class="docs-hero panel panel-strong">
    <div class="kicker">Documentation</div>
    <h1 class="headline mt-2">Potato Cloud Guide</h1>
    <p class="subtle mt-3" style="max-width: 720px;">
      Simple cloud management for your own hardware. This guide covers setup, usage,
      and operational details for the control plane and agent.
    </p>
    <div class="docs-hero-actions">
      <a href="/" class="btn btn-primary">Open Stacks</a>
      <a href="#step-by-step-usage" class="btn btn-ghost">Get Started</a>
    </div>
  </div>

  <div class="docs-shell">
    <aside class="docs-sidebar panel">
      <div class="kicker">Contents</div>
      <nav class="docs-toc">
        <a href="#what-you-need-before-you-start">What You Need Before You Start</a>
        <a href="#cloudflare-access-setup">Cloudflare Access Setup</a>
        <a href="#system-requirements">System Requirements</a>
        <a href="#how-the-system-works">How the System Works</a>
        <a href="#a-tour-of-the-web-interface">A Tour of the Web Interface</a>
        <a href="#step-by-step-usage">Step-by-Step Usage</a>
        <a href="#using-private-github-repositories-with-ssh">Using Private GitHub Repositories with SSH</a>
        <a href="#managing-secrets-securely">Managing Secrets Securely</a>
        <a href="#understanding-service-settings">Understanding Service Settings</a>
      </nav>
    </aside>

    <div class="docs-main">
      ${docsContent()}
    </div>
  </div>

  <style>
    html { scroll-behavior: smooth; }
    .docs-hero {
      background: linear-gradient(130deg, rgba(15, 118, 110, 0.08), rgba(245, 158, 11, 0.08));
    }
    .docs-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
    .docs-shell {
      display: grid;
      gap: 22px;
      margin-top: 28px;
    }
    .docs-shell > * { min-width: 0; }
    @media (min-width: 960px) {
      .docs-shell { grid-template-columns: 260px 1fr; align-items: start; }
      .docs-sidebar { position: sticky; top: 96px; }
    }
    .docs-toc {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }
    .docs-toc a {
      text-decoration: none;
      color: var(--muted);
      font-size: 0.9rem;
      padding: 6px 10px;
      border-radius: 10px;
    }
    .docs-toc a:hover { color: var(--ink); background: rgba(148, 163, 184, 0.12); }
    .docs-main { display: grid; gap: 22px; min-width: 0; }
    .docs-section {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      padding: 22px;
      display: grid;
      gap: 12px;
      scroll-margin-top: 120px;
      min-width: 0;
    }
    .docs-section h2 { font-size: 1.4rem; margin: 0; }
    .docs-section h3 { font-size: 1.05rem; margin: 10px 0 0; }
    .docs-section p { margin: 0; color: var(--muted); line-height: 1.7; }
    .docs-section ul, .docs-section ol { margin: 0; padding-left: 18px; color: var(--muted); display: grid; gap: 8px; }
    .docs-section li { line-height: 1.6; }
    .docs-section code { background: rgba(148, 163, 184, 0.18); padding: 2px 6px; border-radius: 6px; font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace; font-size: 0.85rem; color: var(--ink); }
    .docs-section pre { margin: 0; overflow-x: auto; }
    .docs-section pre code {
      display: block;
      padding: 14px 16px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.92);
      color: #e2e8f0;
      font-size: 0.82rem;
      min-width: 0;
    }
    .docs-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; display: block; overflow-x: auto; }
    .docs-table tbody, .docs-table thead, .docs-table tr { display: table; width: 100%; table-layout: fixed; }
    .docs-table th, .docs-table td { text-align: left; padding: 10px; border-bottom: 1px solid var(--panel-border); }
    .docs-table th { font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
    .docs-callout {
      border: 1px solid rgba(15, 118, 110, 0.3);
      background: rgba(15, 118, 110, 0.08);
      border-radius: 14px;
      padding: 14px 16px;
      color: var(--ink);
    }
  </style>
  `;

  return layout(content, "Documentation - Potato Cloud");
}

function docsContent(): string {
  return `
    <section id="what-you-need-before-you-start" class="docs-section">
      <h2>What You Need Before You Start</h2>
      <ul>
        <li>A deployed control plane URL (provided by your administrator)</li>
        <li>A Linux server (Ubuntu or Debian recommended) where the agent will run</li>
        <li>Root or sudo access on the Linux server</li>
        <li>For private GitHub repositories: permission to add deploy keys</li>
        <li>A Cloudflare Access service token (client ID and secret) for the agent</li>
        <li>Cloudflare Tunnel URL (optional) for HTTPS without buying SSL certificates</li>
        <li>Agent binary available for multiple architectures (ARM64 and AMD64)</li>
      </ul>
      <div class="docs-callout">
        Note: The control plane is protected by Cloudflare Access and expects a service token on agent requests.
      </div>
    </section>

    <section id="cloudflare-access-setup" class="docs-section">
      <h2>Cloudflare Access Setup</h2>
      <p>Potato Cloud uses Cloudflare Access for agent authentication and recommends Cloudflare Tunnel for inbound traffic.</p>
      <h3>Create a Service Token</h3>
      <ol>
        <li>Cloudflare Zero Trust → Access → Service Tokens → Create token</li>
        <li>Copy the Client ID and Client Secret</li>
        <li>Add the token to your Access policy protecting the control plane</li>
      </ol>
      <h3>Suggested Implementation</h3>
      <ul>
        <li>Protect the control plane with an Access app and a service-token policy</li>
        <li>Use Cloudflare Tunnel for HTTPS ingress to services (no open inbound ports)</li>
        <li>Rotate service tokens periodically and keep them out of logs</li>
      </ul>
    </section>

    <section id="system-requirements" class="docs-section">
      <h2>System Requirements</h2>
      <h3>Minimum Hardware</h3>
      <ul>
        <li>Raspberry Pi 4B+ or any Linux server (ARM64 or AMD64)</li>
        <li>Old laptop collecting dust is fine</li>
        <li>VPS with 5GB+ disk space</li>
        <li>Internet connection</li>
      </ul>
      <h3>Recommended Infrastructure</h3>
      <ul>
        <li>Ubuntu 20.04+ or Debian 11+</li>
        <li>2GB+ RAM for multiple services</li>
        <li>20GB+ disk space</li>
        <li>Docker 20.10+ (for Docker runtime)</li>
        <li>Cloudflare Tunnel (for HTTPS without buying certs)</li>
        <li>Domain name pointing to your tunnel</li>
      </ul>
      <h3>Hardware Options</h3>
      <ul>
        <li>Raspberry Pi - Perfect for home labs, $35-75</li>
        <li>Refurbished laptop - Convert to production server, free hardware</li>
        <li>Cheap VPS - Cloud providers starting at $3/month</li>
        <li>Your closet - Any Linux machine can become a cloud server</li>
      </ul>
      <h3>Storage Requirements</h3>
      <ul>
        <li>10GB for basic services</li>
        <li>20GB+ for Docker applications</li>
        <li>External SSD for best performance (optional)</li>
      </ul>
    </section>

    <section id="how-the-system-works" class="docs-section">
      <h2>How the System Works</h2>
      <p>Potato Cloud runs on your infrastructure in two parts:</p>
      <h3>Control Plane</h3>
      <p>A web application running on Cloudflare Workers where you configure what should run and monitor status.</p>
      <h3>Agent</h3>
      <p>A lightweight Go application installed on your server via an install script. It:</p>
      <ul>
        <li>Pulls configuration from the control plane every 30 seconds (or instantly on push notifications)</li>
        <li>Clones and pulls Git repositories on changes</li>
        <li>Runs build commands</li>
        <li>Starts and supervises services</li>
        <li>Routes incoming HTTP traffic to the correct service</li>
        <li>Provides internal DNS for service-to-service communication</li>
        <li>Sends health and status back to the dashboard</li>
        <li>Authenticates through Cloudflare Access using a service token</li>
        <li>Securely stores secrets with AES-256-GCM encryption</li>
        <li>Rebuilds services automatically when you push to Git</li>
        <li>Handles blue-green deployments with zero downtime</li>
      </ul>
      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Stack</strong>: A collection of related services that run together</li>
        <li><strong>Service</strong>: A single application (Git repository + build command + run command)</li>
        <li><strong>Agent</strong>: The program that runs on your server to deploy services</li>
        <li><strong>External Proxy</strong>: Routes incoming web traffic based on URL path</li>
        <li><strong>Internal DNS</strong>: Services talk to each other using names like <code>http://my-service.svc.internal</code></li>
        <li><strong>Secrets</strong>: Sensitive values stored encrypted on the agent, never in the control plane</li>
      </ul>
    </section>

    <section id="a-tour-of-the-web-interface" class="docs-section">
      <h2>A Tour of the Web Interface</h2>
      <p>The control plane dashboard lists all stacks. Each stack links to a detail page.</p>
      <h3>Stack Detail Page</h3>
      <ul>
        <li>Top section: Stack configuration (name, poll interval, security mode)</li>
        <li>Services section: service cards with status, runtime, ports, external path, and actions</li>
        <li>Agents section: agent status, last heartbeat time, and actions</li>
      </ul>
      <p>Add or edit actions open full-page forms for services and a modal for agents.</p>
    </section>

    <section id="step-by-step-usage" class="docs-section">
      <h2>Step-by-Step Usage</h2>
      <h3>Step 1: Create a Stack</h3>
      <ol>
        <li>Open the control plane dashboard</li>
        <li>Click New Stack</li>
        <li>Fill in name, description, poll interval, and security mode</li>
        <li>Click Create</li>
      </ol>
      <h3>Step 2: Add Your First Service</h3>
      <ol>
        <li>Open the stack detail page</li>
        <li>Click Add Service</li>
        <li>Fill in required fields: name, repository URL, Git reference, run command, port</li>
        <li>Fill in optional fields as needed</li>
        <li>Click Save</li>
      </ol>
      <h3>Step 3: Install the Agent</h3>
      <p>From the stack detail page, generate a setup command and run it on your server:</p>
      <pre><code>curl -fsSL https://your-domain.com/install.sh | sudo bash -s -- --agent-id &lt;AGENT_ID&gt; --stack-id &lt;STACK_ID&gt; --control-plane https://your-control-plane.workers.dev --access-client-id &lt;CF_ACCESS_CLIENT_ID&gt; --access-client-secret &lt;CF_ACCESS_CLIENT_SECRET&gt;</code></pre>
      <h3>Step 4: Verify Installation</h3>
      <pre><code>sudo potato-cloud-agent -status
sudo journalctl -u potato-cloud-agent -f
# or if using nohup:
tail -f /var/log/potato-cloud-agent.log</code></pre>
      <h3>Managing the Agent</h3>
      <pre><code>sudo potato-cloud-agent -status
sudo systemctl stop potato-cloud-agent
sudo systemctl restart potato-cloud-agent
sudo journalctl -u potato-cloud-agent -f</code></pre>
    </section>

    <section id="using-private-github-repositories-with-ssh" class="docs-section">
      <h2>Using Private GitHub Repositories with SSH</h2>
      <h3>Step 1: Generate an SSH Key</h3>
      <pre><code>sudo potato-cloud-agent -gen-ssh-key -ssh-key-name default</code></pre>
      <h3>Step 2: Add to GitHub</h3>
      <ol>
        <li>Open repository settings and add a deploy key</li>
        <li>Paste the public key</li>
        <li>Allow write access only if needed</li>
      </ol>
      <h3>Step 3: Add GitHub to Known Hosts</h3>
      <pre><code>sudo mkdir -p /var/lib/potato-cloud/ssh
sudo ssh-keyscan github.com | sudo tee -a /var/lib/potato-cloud/ssh/known_hosts</code></pre>
      <h3>Step 4: Configure the Service</h3>
      <ul>
        <li>Repository URL: <code>git@github.com:username/repo.git</code></li>
        <li>SSH Key Name: <code>default</code></li>
      </ul>
    </section>

    <section id="managing-secrets-securely" class="docs-section">
      <h2>Managing Secrets Securely</h2>
      <p>Never store sensitive values in Environment Variables. Use secrets instead.</p>
      <h3>How It Works</h3>
      <ol>
        <li>Define secret names in the dashboard for a service</li>
        <li>Set secret values on the agent server via CLI</li>
        <li>Secrets are injected as environment variables at runtime</li>
      </ol>
      <h3>Setting Secrets</h3>
      <pre><code>sudo potato-cloud-agent -add-secret -service &lt;service-id&gt; -secret-name DATABASE_URL
sudo potato-cloud-agent -add-secret -service &lt;service-id&gt; -secret-name API_KEY -value "your-secret-value"
sudo potato-cloud-agent -list-secrets -service &lt;service-id&gt;
sudo potato-cloud-agent -delete-secret -service &lt;service-id&gt; -secret-name API_KEY</code></pre>
      <h3>Finding Service ID</h3>
      <ul>
        <li>Use the stack detail page</li>
        <li>Or run <code>sudo potato-cloud-agent -status</code></li>
      </ul>
      <h3>Example Workflow</h3>
      <pre><code># Get the service ID
sudo potato-cloud-agent -status

# Set secrets
sudo potato-cloud-agent -add-secret -service abc-123-def -secret-name DATABASE_URL
sudo potato-cloud-agent -add-secret -service abc-123-def -secret-name JWT_SECRET

# Verify
sudo potato-cloud-agent -list-secrets -service abc-123-def</code></pre>
      <h3>Security Features</h3>
      <ul>
        <li>Secrets encrypted with AES-256-GCM</li>
        <li>Keys derived from the agent ID</li>
        <li>Secrets stored locally with 0600 permissions</li>
        <li>No network transfer of secret values</li>
        <li>Secret values are never stored in the control plane</li>
        <li>Secrets isolated per service</li>
      </ul>
      <h3>Backup Considerations</h3>
      <ol>
        <li>Set up the new server with a new agent</li>
        <li>Manually re-add all secrets using the CLI commands</li>
        <li>Keep a secure offline record of your secrets for disaster recovery</li>
      </ol>
    </section>

    <section id="understanding-service-settings" class="docs-section">
      <h2>Understanding Service Settings</h2>
      <h3>Required Fields</h3>
      <table class="docs-table">
        <tr>
          <th>Field</th>
          <th>Description</th>
          <th>Example</th>
        </tr>
        <tr>
          <td>Name</td>
          <td>Unique identifier for the service</td>
          <td><code>api</code></td>
        </tr>
        <tr>
          <td>Repository URL</td>
          <td>Git repository address</td>
          <td><code>https://github.com/user/repo.git</code></td>
        </tr>
        <tr>
          <td>Git Reference</td>
          <td>Branch or tag to track</td>
          <td><code>main</code></td>
        </tr>
        <tr>
          <td>Run Command</td>
          <td>Command to start the service</td>
          <td><code>npm start</code></td>
        </tr>
        <tr>
          <td>Port</td>
          <td>Port your app listens on</td>
          <td><code>3000</code></td>
        </tr>
      </table>

      <h3>Optional Fields</h3>
      <table class="docs-table">
        <tr>
          <th>Field</th>
          <th>Description</th>
          <th>Example</th>
        </tr>
        <tr>
          <td>Description</td>
          <td>Human-readable description</td>
          <td>Main API server</td>
        </tr>
        <tr>
          <td>Git Commit</td>
          <td>Pin to a specific commit</td>
          <td><code>abc123def456</code></td>
        </tr>
        <tr>
          <td>SSH Key Name</td>
          <td>Name of SSH key for private repos</td>
          <td><code>default</code></td>
        </tr>
        <tr>
          <td>Build Command</td>
          <td>Run before starting service</td>
          <td><code>npm ci && npm run build</code></td>
        </tr>
        <tr>
          <td>External Path</td>
          <td>URL path for external access</td>
          <td><code>/api</code></td>
        </tr>
        <tr>
          <td>Health Check Path</td>
          <td>HTTP path for health checks</td>
          <td><code>/health</code></td>
        </tr>
        <tr>
          <td>Health Check Interval</td>
          <td>Seconds between health checks</td>
          <td><code>30</code></td>
        </tr>
        <tr>
          <td>Environment Variables</td>
          <td>JSON object of non-sensitive env vars</td>
          <td><code>{"NODE_ENV": "production"}</code></td>
        </tr>
        <tr>
          <td>Secret Names</td>
          <td>Array of secret names to inject</td>
          <td><code>["DATABASE_URL", "API_KEY"]</code></td>
        </tr>
        <tr>
          <td>Runtime</td>
          <td>process or docker</td>
          <td><code>process</code></td>
        </tr>
        <tr>
          <td>Dockerfile Path</td>
          <td>Path to Dockerfile (Docker only)</td>
          <td><code>Dockerfile</code></td>
        </tr>
        <tr>
          <td>Docker Context</td>
          <td>Build context (Docker only)</td>
          <td><code>.</code></td>
        </tr>
        <tr>
          <td>Docker Container Port</td>
          <td>Container internal port (Docker only)</td>
          <td><code>3000</code></td>
        </tr>
        <tr>
          <td>Image Retain Count</td>
          <td>Old Docker images to keep</td>
          <td><code>5</code></td>
        </tr>
      </table>

      <h3>Environment Variables vs Secrets</h3>
      <p>Use environment variables for non-sensitive values like NODE_ENV and public URLs.</p>
      <p>Use secrets for passwords, API keys, private keys, and any sensitive credential.</p>

      <h3>Environment Variables Format</h3>
      <pre><code>{
  "NODE_ENV": "production",
  "PORT": "3000",
  "LOG_LEVEL": "info"
}</code></pre>

      <h3>Secret Names Format</h3>
      <pre><code>["DATABASE_URL", "API_KEY", "JWT_SECRET"]</code></pre>

      <div class="docs-callout">
        <strong>Important Notes</strong>
        <ul>
          <li>Commands are run via /bin/sh -c, so shell features like &&, ||, and $VAR work.</li>
          <li>The agent injects internal URLs: SERVICE_NAME_URL=http://name.svc.internal</li>
          <li>Secrets override environment variables if they share the same name.</li>
        </ul>
      </div>
    </section>
  `;
}
