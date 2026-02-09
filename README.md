# Potato Cloud 🥔

**Simple cloud management. As easy as a potato.**

Potato Cloud is a lightweight platform that lets you deploy services from Git repositories on your own hardware. No complex setup, no vendor lock-in—just bring your own servers and repos, and we'll handle the rest. It's cloud computing without the headache. The control plane is already deployed to Cloudflare, and this guide explains how to use the deployed application and the agent without needing to know anything about the internal implementation.

## Table of Contents

- [What You Need Before You Start](#what-you-need-before-you-start)
- [System Requirements](#system-requirements)
- [How the System Works](#how-the-system-works)
- [A Tour of the Web Interface](#a-tour-of-the-web-interface)
- [Step-by-Step Usage](#step-by-step-usage)
- [Using Private GitHub Repositories with SSH](#using-private-github-repositories-with-ssh)
- [Managing Secrets Securely](#managing-secrets-securely)
- [Understanding Service Settings](#understanding-service-settings)
- [Agent Configuration](#agent-configuration)
- [Directory Structure](#directory-structure)
- [Port Requirements](#port-requirements)
- [Accessing Your Services](#accessing-your-services)
- [Docker Runtime Support](#docker-runtime-support)
- [Security Modes](#security-modes)
- [What Happens When You Update](#what-happens-when-you-update)
- [Logs and Monitoring](#logs-and-monitoring)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)
- [Security Notes](#security-notes)
- [Documentation](#documentation)

## What You Need Before You Start

- A deployed control plane URL (provided by your administrator)
- A Linux server (Ubuntu/Debian recommended) where the agent will run
- Root/sudo access on the Linux server
- For private GitHub repositories: permission to add deploy keys
- Cloudflare Tunnel URL (optional) for HTTPS without buying SSL certificates
- Agent binary available for multiple architectures (ARM64/AMD64)

**Note:** The agent install script will automatically install Go and other dependencies if needed. Agent binary available for ARM64 and AMD64 architectures.

## System Requirements

**Minimum Hardware:**
- Raspberry Pi 4B+ or any Linux server (ARM64/AMD64)
- Old laptop collecting dust? Perfect.
- VPS with 5GB+ disk space
- Internet connection

**Recommended Infrastructure:**
- Ubuntu 20.04+ or Debian 11+
- 2GB+ RAM (for multiple services)
- 20GB+ disk space
- Docker 20.10+ (for Docker runtime)
- Cloudflare Tunnel (for HTTPS without buying certs)
- Domain name pointing to your tunnel

**Hardware Options:**
- **Raspberry Pi** - Perfect for home labs, $35-75
- **Refurbished Laptop** - Convert to production server, free hardware
- **Cheap VPS** - Cloud providers starting at $3/month, great for 24/7
- **Your Closet** - Any Linux machine can become a cloud server

**Storage Requirements:**
- 10GB for basic services
- 20GB+ for Docker applications
- External SSD for best performance (optional)

## How the System Works

Potato Cloud runs on your own infrastructure in two main parts:

1. **Control Plane** - A web application running on Cloudflare Workers where you configure what should run on your servers and monitor their status.

2. **Agent** - A lightweight Go application installed on your Linux server via an install script that:
    - Pulls configuration from the control plane every 30 seconds (or instantly on push notifications)
    - Clones/pulls Git repositories automatically on changes
    - Runs build commands
    - Starts and supervises your services
    - Routes incoming HTTP traffic to the correct service
    - Provides internal DNS for service-to-service communication
    - Sends health and status back to the dashboard
    - Securely stores secrets with AES-256-GCM encryption
    - Runs on Raspberry Pi, old laptops, VPS, or any Linux machine
    - Rebuilds services automatically when you push to Git
    - Handles blue-green deployments with zero downtime

**Key Concepts:**
- **Stack**: A collection of related services that run together
- **Service**: A single application (Git repository + build command + run command)
- **Agent**: The program that runs on your server to deploy services
- **External Proxy**: Routes incoming web traffic to services based on URL path
- **Internal DNS**: Allows services to talk to each other using names like `http://my-service.svc.internal`
- **Secrets**: Sensitive values (API keys, passwords) stored encrypted on the agent, never in the control plane

## A Tour of the Web Interface

When you open the control plane, you see the **Dashboard** - a list of all your stacks. Each stack row links to a detail page, and there's a "New Stack" button.

The **Stack Detail** page is your main workspace:
- **Top section**: Stack configuration (name, poll interval, security mode)
- **Services section**: Lists all services with their status. Each service shows:
  - Name and description
  - Git repository URL
  - Port the service listens on
  - External path (if exposed through the proxy)
  - Runtime type (process or Docker)
  - Status badge (running, building, error, etc.)
  - Health status (healthy/unhealthy)
  - Action buttons: Edit, Delete
  - "Add Service" button

- **Agents section**: Lists all agents registered to this stack with:
  - Name and status (online/offline)
  - Last heartbeat time
  - Action buttons: Edit, Delete
  - "Add Agent" button to generate install tokens

When you add or edit anything, a modal dialog opens. The **Service dialog** includes all configuration options like repository URL, branch, build/run commands, ports, and secret references. The **Agent dialog** generates an install token and shows the exact command to run on your server.

## Step-by-Step Usage

### Step 1: Create a Stack

1. Open the control plane dashboard in your browser
2. Click "New Stack"
3. Fill in:
   - **Name**: A unique name (e.g., "production", "staging")
   - **Description**: Optional description
   - **Poll Interval**: How often the agent checks for changes (default: 30 seconds)
   - **Security Mode**: Choose `none` for beginners (see Security Modes section)
4. Click "Create"
5. Click the stack name to open the Stack Detail page

### Step 2: Add Your First Service

On the Stack Detail page:

1. Click "Add Service"
2. Fill in the required fields:
   - **Name**: Service identifier (e.g., "api", "web", "worker")
   - **Repository URL**: Git URL (HTTPS for public, SSH for private)
   - **Git Reference**: Branch or tag to track (e.g., "main", "v1.2.0")
   - **Run Command**: Command to start the service (e.g., `npm start`, `python app.py`)
   - **Port**: The port your application listens on

3. Fill in optional fields:
   - **Build Command**: Command to run before starting (e.g., `npm install && npm run build`)
   - **External Path**: URL path to expose this service (e.g., `/api` makes it available at `http://your-server:8080/api`)
   - **Health Check Path**: Path for health checks (default: `/health`)
   - **Environment Variables**: Non-sensitive config values as JSON (e.g., `{"NODE_ENV": "production"}`)
   - **Secret Names**: List of secret names that should be injected as environment variables (e.g., `["DATABASE_URL", "API_KEY"]`). See [Managing Secrets Securely](#managing-secrets-securely) for how to set these values.

4. Click "Save"

### Step 3: Install the Agent on Your Server

On the Stack Detail page:

1. Click "Add Agent"
2. Enter a name (e.g., "server-01")
3. Click "Generate Token"
4. Copy the install command shown - it will look like:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/corrieuys/potato-cloud-agent/main/install.sh | sudo bash -s -- --token <INSTALL_TOKEN> --control-plane https://your-control-plane.workers.dev
   ```

5. **SSH into your Linux server** and run the install command:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/corrieuys/potato-cloud-agent/main/install.sh | sudo bash -s -- --token <INSTALL_TOKEN> --control-plane https://your-control-plane.workers.dev
   ```

The install script will:
- Install Go if not present
- Download and build the agent
- Register the agent with the control plane
- Create necessary directories
- Start the agent as a background service

**That's it!** The agent is now running and will automatically deploy your services.

### Step 4: Verify Installation

Check that the agent is running:

```bash
# Check service status
sudo potato-cloud-agent -status

# View agent logs
sudo journalctl -u potato-cloud-agent -f
# or if using nohup:
tail -f /var/log/potato-cloud-agent.log
```

You should see your services listed as "running" in both the CLI output and the web dashboard.

### Managing the Agent

**Check status:**
```bash
sudo potato-cloud-agent -status
```

**Stop the agent:**
```bash
sudo systemctl stop potato-cloud-agent
# or if not using systemd:
sudo pkill potato-cloud-agent
```

**Restart the agent:**
```bash
sudo systemctl restart potato-cloud-agent
# or:
sudo potato-cloud-agent -config /etc/potato-cloud/config.json -control-plane https://your-control-plane.workers.dev
```

**View logs:**
```bash
sudo journalctl -u potato-cloud-agent -f
```

## Using Private GitHub Repositories with SSH

For private repositories, use SSH deploy keys. The private key stays on the agent and never leaves the server.

### Step 1: Generate an SSH Key

On your Linux server (after agent is installed):

```bash
sudo potato-cloud-agent -gen-ssh-key -ssh-key-name default
```

This prints the public key. Copy it completely (starts with `ssh-ed25519` or `ssh-rsa`).

### Step 2: Add to GitHub

1. Go to your GitHub repository
2. Click Settings → Deploy keys → Add deploy key
3. Paste the public key
4. Give it a title like "Potato Cloud Agent"
5. Check "Allow write access" only if needed
6. Click "Add key"

### Step 3: Add GitHub to Known Hosts

```bash
sudo mkdir -p /var/lib/potato-cloud/ssh
sudo ssh-keyscan github.com | sudo tee -a /var/lib/potato-cloud/ssh/known_hosts
```

### Step 4: Configure the Service

In the web UI, edit your service:
- Set **Repository URL** to SSH format: `git@github.com:username/repo.git`
- Set **SSH Key Name** to: `default`

The agent will use `/var/lib/potato-cloud/ssh/default` to authenticate.

## Managing Secrets Securely

**Important:** Never store sensitive values (passwords, API keys, tokens) in the Environment Variables field in the dashboard. Those are stored in the control plane database. Instead, use the **Secret Management** system.

### How It Works

1. **In the dashboard**: You define which secret names a service needs (e.g., `DATABASE_URL`, `API_KEY`)
2. **On the agent server**: You set the actual secret values using CLI commands
3. **At runtime**: The agent injects the secrets as environment variables
4. **Storage**: Secrets are encrypted with AES-256-GCM using a key derived from your agent ID

### Setting Secrets

SSH into your server and use the agent CLI:

**Add a secret:**
```bash
sudo potato-cloud-agent -add-secret -service <service-id> -secret-name DATABASE_URL
# You'll be prompted to enter the secret value
```

**Add a secret non-interactively (for scripts):**
```bash
sudo potato-cloud-agent -add-secret -service <service-id> -secret-name API_KEY -value "your-secret-value"
```

**List secrets for a service:**
```bash
sudo potato-cloud-agent -list-secrets -service <service-id>
```

**Delete a secret:**
```bash
sudo potato-cloud-agent -delete-secret -service <service-id> -secret-name API_KEY
```

### Finding Service ID

To get the service ID:
1. Go to the Stack Detail page in the dashboard
2. Look at the service card - the ID is shown in small text, or
3. Use `sudo potato-cloud-agent -status` to see service names and IDs

### Example Workflow

Let's say you have a web service that needs a database connection string:

1. **In the dashboard**, create or edit the service:
   - Name: `web-api`
   - Repository URL: `https://github.com/myorg/api.git`
   - Run Command: `npm start`
   - **Secret Names**: `["DATABASE_URL", "JWT_SECRET"]`

2. **SSH into your server** and set the secrets:
   ```bash
   # Get the service ID
   sudo potato-cloud-agent -status
   # Output shows: web-api (ID: abc-123-def)
   
   # Set the database URL
   sudo potato-cloud-agent -add-secret -service abc-123-def -secret-name DATABASE_URL
   # Enter: postgres://user:pass@localhost:5432/mydb
   
   # Set the JWT secret
   sudo potato-cloud-agent -add-secret -service abc-123-def -secret-name JWT_SECRET
   # Enter: your-super-secret-jwt-signing-key
   ```

3. **Verify secrets are set:**
   ```bash
   sudo potato-cloud-agent -list-secrets -service abc-123-def
   ```

4. **Restart the service** if it's already running (secrets are loaded at startup):
   ```bash
   sudo systemctl restart potato-cloud-agent
   ```

Now your application can access these secrets as environment variables:
```javascript
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
```

### Security Features

- **Encryption**: All secrets are encrypted with AES-256-GCM
- **Unique Keys**: Each agent uses a unique encryption key derived from its agent ID
- **Permissions**: Secret files are stored with 0600 permissions (owner read/write only)
- **No Network Transfer**: Secrets never leave the agent server
- **No Dashboard Storage**: Secret values are never stored in the control plane
- **Isolated**: Secrets are isolated per service (service A cannot access service B's secrets)

### Backup Considerations

Since secrets are encrypted with a key derived from the agent ID, **you cannot backup and restore secrets to a different agent**. If you need to migrate to a new server:

1. Set up the new server with a new agent
2. Manually re-add all secrets using the CLI commands
3. Keep a secure offline record of your secrets for disaster recovery

## Understanding Service Settings

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Unique identifier for the service | `api`, `web`, `worker` |
| **Repository URL** | Git repository address | `https://github.com/user/repo.git` |
| **Git Reference** | Branch or tag to track | `main`, `v1.2.0` |
| **Run Command** | Command to start the service | `npm start`, `python app.py` |
| **Port** | Port your app listens on | `3000`, `8080` |

### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Description** | Human-readable description | "Main API server" |
| **Git Commit** | Pin to specific commit (overrides branch) | `abc123def456` |
| **SSH Key Name** | Name of SSH key for private repos | `default`, `production` |
| **Build Command** | Run before starting service | `npm ci && npm run build` |
| **External Path** | URL path for external access | `/api` → `http://server:8080/api` |
| **Health Check Path** | HTTP path for health checks | `/health`, `/status` |
| **Health Check Interval** | Seconds between health checks | `30` |
| **Environment Variables** | JSON object of non-sensitive env vars | `{"NODE_ENV": "production"}` |
| **Secret Names** | Array of secret names to inject | `["DATABASE_URL", "API_KEY"]` |
| **Runtime** | `process` or `docker` | `process` (default) |
| **Dockerfile Path** | Path to Dockerfile (Docker only) | `Dockerfile`, `docker/Dockerfile` |
| **Docker Context** | Build context (Docker only) | `.`, `./docker` |
| **Docker Container Port** | Container's internal port (Docker only) | `3000` |
| **Image Retain Count** | Old Docker images to keep | `5` |

### Environment Variables vs Secrets

**Use Environment Variables for:**
- Non-sensitive configuration (`NODE_ENV`, `PORT`, `LOG_LEVEL`)
- Feature flags
- Public URLs
- Any value that's safe to store in the control plane database

**Use Secrets for:**
- Database connection strings with passwords
- API keys and tokens
- Private keys
- Passwords
- Any sensitive credential

### Environment Variables Format

Non-sensitive environment variables are stored as a JSON object:

```json
{
  "NODE_ENV": "production",
  "PORT": "3000",
  "LOG_LEVEL": "info"
}
```

### Secret Names Format

Secret names are stored as a JSON array of strings:

```json
["DATABASE_URL", "API_KEY", "JWT_SECRET"]
```

The actual values are set via CLI on the agent server and injected at runtime.

**Important Notes:**
- Commands are run via `/bin/sh -c`, so you can use shell features like `&&`, `||`, `$VAR`
- The agent also injects internal service URLs automatically: `SERVICE_<NAME>_URL=http://<name>.svc.internal`
- Secrets override environment variables if they have the same name
