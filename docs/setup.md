# Potato Cloud - Setup Guide

This guide will help you set up the Potato Cloud deployment platform.

## Architecture Overview

Potato Cloud consists of two main components:

1. **Control Plane** (Cloudflare Workers + D1 Database) - The dashboard and API
2. **Agent** (Go binary) - Runs on your Linux servers to deploy applications

## End-to-End Workflow

1. **Create a stack** in the control plane.
2. **Add services** with repo URL, ref, build/run commands, and optional SSH key name.
3. **Register an agent** using an install token.
4. Agent **polls desired state**, **clones/pulls repos**, **builds**, and **runs** services.
5. Agent **sends heartbeats** with service health and status.
6. Changes to service config or git branch automatically trigger a new deploy.

## Prerequisites

- Node.js 18+ for the control plane development
- Go 1.21+ for the agent
- A Cloudflare account with Workers and D1 enabled
- One or more Linux servers (AMD64 or ARM64) for running applications

## Step 1: Set Up the Control Plane

### 1.1 Install Dependencies

```bash
cd /Users/corrieuys/Repositories/personal/potato-cloud
npm install
```

### 1.2 Create D1 Database

```bash
# Create a new D1 database
npx wrangler d1 create potato-cloud-db

# Note the database ID from the output and update wrangler.jsonc
```

### 1.3 Initialize the Database Schema

```bash
# Apply the schema to your D1 database
npx wrangler d1 execute potato-cloud-db --file=./schema.sql
```

### 1.4 Update wrangler.jsonc

Edit `wrangler.jsonc` and update the `database_id` field with your actual D1 database ID:

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "potato-cloud-db",
    "database_id": "your-actual-database-id"
  }
]
```

### 1.5 Deploy the Control Plane

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

Your control plane will be available at `https://potato-cloud.your-subdomain.workers.dev`

## Step 2: Build the Agent

### 2.1 Install Go Dependencies

```bash
cd agent
go mod tidy
```

### 2.2 Build the Agent Binary

```bash
# Build for Linux AMD64
GOOS=linux GOARCH=amd64 go build -o potato-cloud-agent-linux-amd64 ./cmd/agent

# Build for Linux ARM64
GOOS=linux GOARCH=arm64 go build -o potato-cloud-agent-linux-arm64 ./cmd/agent
```

## Step 3: Create Your First Stack

### 3.1 Create a Stack via API

```bash
curl -X POST https://potato-cloud.your-subdomain.workers.dev/api/stacks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production",
    "description": "Production applications",
    "poll_interval": 30,
    "security_mode": "none"
  }'
```

Note the `stack_id` from the response.

### 3.2 Add a Service

```bash
curl -X POST https://potato-cloud.your-subdomain.workers.dev/api/stacks/{stack_id}/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "myapp",
    "git_url": "https://github.com/youruser/yourapp.git",
    "git_ref": "main",
    "git_ssh_key": "default",
    "build_command": "npm install && npm run build",
    "run_command": "npm start",
    "port": 3000,
    "external_path": "/myapp",
    "environment_vars": {
      "NODE_ENV": "production"
    }
  }'
```

## SSH Deploy Keys (Out-of-Band)

For private GitHub repos, use SSH deploy keys created on the agent. The control plane never handles private keys.

### 1) Generate a key on the agent

```bash
sudo /opt/potato-cloud/potato-cloud-agent -gen-ssh-key -ssh-key-name default
```

This prints the public key. Add it in GitHub as a **Deploy Key** (read-only recommended).

### 2) Add GitHub host key

```bash
sudo mkdir -p /var/lib/potato-cloud/ssh
sudo ssh-keyscan github.com | sudo tee -a /var/lib/potato-cloud/ssh/known_hosts
```

### 3) Use SSH URL + key name in service config

```json
{
  "git_url": "git@github.com:org/repo.git",
  "git_ref": "main",
  "git_ssh_key": "default"
}
```

If `git_ssh_key` is empty or the key is missing, the agent falls back to unauthenticated HTTPS.

## Step 4: Install the Agent on a Server

### 4.1 Generate an Install Token

```bash
curl -X POST https://potato-cloud.your-subdomain.workers.dev/api/stacks/{stack_id}/agents/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "name": "server-01"
  }'
```

Note the `install_token` from the response.

### 4.2 Install on Your Server

On your Linux server:

```bash
# Option 1: Using the install script
curl -fsSL https://your-domain.com/install.sh | sudo bash -s -- --token <install_token>

# Option 2: Manual installation
# Copy the agent binary to your server
scp potato-cloud-agent-linux-amd64 user@server:/tmp/

# On the server:
sudo mv /tmp/potato-cloud-agent-linux-amd64 /opt/potato-cloud/potato-cloud-agent
sudo chmod +x /opt/potato-cloud/potato-cloud-agent

# Register the agent
sudo /opt/potato-cloud/potato-cloud-agent -register <install_token> -control-plane https://potato-cloud.your-subdomain.workers.dev

# Create systemd service
sudo tee /etc/systemd/system/potato-cloud-agent.service > /dev/null <<EOF
[Unit]
Description=Potato Cloud Agent
After=network.target

[Service]
Type=simple
ExecStart=/opt/potato-cloud/potato-cloud-agent -config /etc/potato-cloud/config.json
Restart=always
RestartSec=5
User=root
WorkingDirectory=/var/lib/potato-cloud

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable potato-cloud-agent
sudo systemctl start potato-cloud-agent

# Check status
sudo systemctl status potato-cloud-agent
sudo journalctl -u potato-cloud-agent -f
```

## Step 5: Verify Everything Works

### 5.1 Check Agent Status

```bash
# View the stack and agents
curl https://potato-cloud.your-subdomain.workers.dev/api/stacks/{stack_id}
```

You should see your agent listed with status "online".

### 5.2 View Events

Events are not part of the control plane in the current architecture.

### 5.3 Access Your Application

If your agent is running in "none" security mode (no firewall hardening):

```bash
# Access directly
curl http://your-server:8080/myapp
```

For production, you'll want to set up Cloudflare Tunnel (see Security section below).

## API Reference

### Stacks

- `GET /api/stacks` - List all stacks
- `POST /api/stacks` - Create a new stack
- `GET /api/stacks/:id` - Get stack details
- `PATCH /api/stacks/:id` - Update stack
- `DELETE /api/stacks/:id` - Delete stack

### Services

- `GET /api/stacks/:stackId/services` - List services
- `POST /api/stacks/:stackId/services` - Create service
- `PATCH /api/stacks/:stackId/services/:serviceId` - Update service
- `DELETE /api/stacks/:stackId/services/:serviceId` - Delete service

### Agents

- `GET /api/stacks/:stackId/agents` - List agents
- `POST /api/stacks/:stackId/agents/tokens` - Generate install token
- `POST /api/agents/register` - Register agent (called by agent)
- `DELETE /api/stacks/:stackId/agents/:agentId` - Remove agent

### Agent Communication

- `GET /api/stacks/:stackId/desired-state` - Get desired state (agent polling)
- `POST /api/agents/heartbeat` - Send heartbeat

## Security Modes

The agent supports three security modes:

### Mode A: No Hardening (`"security_mode": "none"`)
- No firewall changes
- Agent binds to all interfaces
- Suitable for development/testing

### Mode B: Daemon Port Only (`"security_mode": "daemon-port"`)
- Blocks all inbound except agent proxy port
- Optional SSH restrictions
- Suitable for direct server exposure

### Mode C: Block All Inbound (`"security_mode": "blocked"`)
- All inbound traffic blocked
- Uses Cloudflare Tunnel for access
- Recommended for production

To configure, update your stack:

```bash
curl -X PATCH https://potato-cloud.your-subdomain.workers.dev/api/stacks/{stack_id} \
  -H "Content-Type: application/json" \
  -d '{"security_mode": "blocked"}'
```

## Troubleshooting

### Agent won't start

1. Check logs: `sudo journalctl -u potato-cloud-agent -e`
2. Verify config: `sudo cat /etc/potato-cloud/config.json`
3. Test registration manually with `-register` flag

### Services not deploying

1. Check events: `curl /api/stacks/{stack_id}/events`
2. Check agent logs for git/clone errors
3. Verify git URL and credentials are correct
4. Check that build/run commands work manually in `/var/lib/potato-cloud/repos/{service-id}`

### Database errors

1. Verify D1 binding in `wrangler.jsonc`
2. Check that schema was applied: `npx wrangler d1 execute potato-cloud-db --command="SELECT name FROM sqlite_master WHERE type='table'"`

## Next Steps

- Set up Cloudflare Tunnel for secure access
- Configure multiple servers for load balancing
- Add health checks and auto-restart policies
- Set up log aggregation
- Configure secrets management (future feature)
