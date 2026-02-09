# Deployment & Server Management Platform  
## MVP Phase 0 Specification

---

## 1. Purpose

This system is a **self-hosted deployment and server-side application management platform**.

Its goal is to let users:
- Define which web applications should run on a server
- Automatically deploy, build, and run those applications
- Route incoming web traffic to the correct application
- Secure servers by default with minimal exposed surface
- See the real-time status of all servers and applications from a dashboard

The system removes the need to manually SSH into servers, pull code, restart processes, configure reverse proxies, or manage firewall rules by hand.

---

## 2. High-level Overview (Plain Language)

The platform has **two main parts**:

1. **Control Plane (Dashboard)**  
   A web application running on Cloudflare Workers where users configure what should run on their servers and monitor their status.

2. **Agent (Server Runtime + Networking + Security)**  
   A lightweight Go application installed on each Linux server that:
   - Pulls configuration from the dashboard
   - Builds and runs applications
   - Routes incoming traffic to them
   - Provides internal service-to-service networking
   - Optionally locks down the server’s network exposure
   - Reports its status back to the dashboard

Each server runs **exactly one Stack**, which is a collection of services and their configuration.

---

## 3. Core Concepts

| Term | Meaning |
|----|----|
| Stack | The full desired configuration for a server |
| Service | A single runnable web application |
| Agent | The Go program installed on the server |
| Desired State | What the dashboard says should be running |
| Observed State | What is actually running on the server |
| Reverse Proxy | Routes incoming HTTP requests to the correct service |
| Internal DNS | Local domain names for service-to-service communication |
| Security Mode | The inbound network exposure model selected for the server |

---

## 4. System Architecture

┌───────────────────────────────┐
│        Dashboard (UI)          │
│   Cloudflare Workers + D1      │
└───────────────▲───────────────┘
│
Desired State (Pull)
│
┌───────────────┴───────────────┐
│        Agent (Go)              │
│ Build / Run / Proxy / DNS / FW │
└───────────────▲───────────────┘
│
Heartbeats & Events (Push)
│
┌───────────────┴───────────────┐
│     Dashboard Status Store     │
└───────────────────────────────┘

---

## 5. What the Service Does End-to-End

### 5.1 Stack Creation (Dashboard)

The user creates a Stack and defines one or more Services.

For each Service, the user specifies:
- Git repository URL
- Build command
- Run command
- Local port the app listens on
- External URL path
- Environment variables
- Health check endpoint

The dashboard resolves Git references (branches/tags) to **exact commit SHAs** so all servers run identical code.

---

### 5.2 Agent Installation

The dashboard generates a one-time **install token**.

The user runs a single install command on a Linux server. The installer:
- Downloads the agent binary
- Exchanges the install token for credentials
- Registers the server as an instance of the stack
- Installs the agent as a systemd service
- Optionally applies security hardening (see Section 12)

The agent automatically restarts on reboot or crash.

---

### 5.3 Continuous Synchronization

Once running, the agent:
- Polls the dashboard at a fixed interval
- Downloads updated stack configuration when it changes
- Applies changes so the server matches the desired state

For each Service, the agent may:
- Clone the Git repository
- Check out the required commit
- Run the build command
- Start the service process
- Restart it if it crashes
- Perform health checks

---

### 5.4 External Traffic Routing

The agent includes an external reverse proxy.

- Routes requests by URL path
- Proxies traffic to local services on `127.0.0.1`
- Can bind publicly or to loopback only, depending on security mode

---

### 5.5 Internal Service Networking (DNS-based)

Services running on the same server communicate using stable internal hostnames:

- Each service has a DNS-safe name
- Each service is reachable at:
  - `http://<service>.svc.internal`

This is implemented using:
- A local DNS responder for `svc.internal`
- An internal reverse proxy routing by Host header

Services never need to know ports.

---

### 5.6 Status Reporting

The agent reports back to the dashboard:
- Heartbeats (every N seconds)
- Per-service state
- Restart counts and errors
- Security mode and connectivity state

---

## 6. Load Balancing Model

Multiple servers may run the same Stack.

- Each server exposes identical routes
- A Cloudflare Load Balancer or Tunnel distributes traffic
- Servers build and run identical commits

Services are assumed to be stateless or externally stateful.

---

## 7. MVP Phase 0 Scope

### 7.1 Included

**Control Plane**
- Stack configuration
- Install token generation
- Desired state API (versioned + hashed)
- Heartbeat and event ingestion
- Dashboard views:
  - Stack overview
  - Server instances
  - Service status
  - Event timeline

**Agent**
- Token exchange and registration
- Polling desired state
- Git-based service execution
- Build + run supervision
- Health checks
- External reverse proxy (path-based)
- Internal DNS-based service discovery
- Optional firewall hardening
- systemd integration

---

### 7.2 Excluded

- Container runtimes
- TLS termination inside agent
- Secrets vaults
- Multi-stack per server
- Autoscaling
- Remote exec / shell

---

## 8. Desired State Model

Each Stack produces a single desired-state document containing:
- Stack ID
- Version number
- Hash (SHA-256)
- Poll interval
- External proxy config
- Internal DNS config
- Security mode
- List of Services

---

## 9. Agent Responsibilities

The agent:
- Fetches desired state
- Reconciles server state
- Runs services
- Maintains proxies and DNS
- Applies optional security hardening
- Reports health and events

Local state is persisted in SQLite.

---

## 10. Reconciliation Process

1. Validate configuration
2. Sync repositories
3. Build services
4. Start or restart processes
5. Stop removed services
6. Run health checks
7. Mark stack applied or degraded
8. Report status

---

## 11. Reverse Proxy Behavior

### 11.1 External Proxy
- Path-based routing
- Supports WebSockets and streaming
- Bind address depends on security mode

### 11.2 Internal Proxy
- Binds to `127.0.0.1:80`
- Routes by Host header
- Not externally reachable

---

## 12. Security & Network Hardening (MVP Phase 0)

Security hardening is **optional and explicit** during install.  
Three inbound security modes are supported.

---

### 12.1 Security Mode A — No Hardening

- No firewall changes
- Agent binds normally
- Suitable for local development or testing

---

### 12.2 Security Mode B — Allow Inbound to Daemon Port

- Default inbound policy: deny
- Allowed inbound:
  - Agent external proxy port (e.g. 8080)
  - Optional SSH (restricted by IP/CIDR)
- Loopback always allowed
- All outbound allowed

Used when traffic reaches the server directly.

---

### 12.3 Security Mode C — Block All Inbound (Cloudflare Tunnel Mode)

**Recommended default for MVP Phase 0**

- All inbound traffic blocked
- No open ports on the server
- Loopback traffic allowed
- All outbound traffic allowed

Traffic reaches the server only via:
- **Cloudflare Tunnel (outbound connection)**

#### Agent behavior in this mode
- External proxy binds to loopback only (`127.0.0.1:<port>`)
- Cloudflare Tunnel forwards traffic to the agent locally
- No services bind to public interfaces

This creates a “dark server” that cannot be scanned or reached directly from the internet.

---

### 12.4 Firewall Implementation

The installer:
- Detects available firewall tooling (UFW preferred)
- Applies rules according to selected security mode
- Never blocks outbound traffic
- Always allows loopback traffic
- Makes changes reversible on uninstall

Safety guarantees:
- Connectivity checks before enabling rules
- Explicit user consent
- No silent SSH lockout

---

### 12.5 Reporting Security State

The agent reports:
- Active security mode
- External exposure (`none`, `daemon-port`)
- Tunnel connectivity (if applicable)

This is visible in the dashboard per server instance.

---

## 13. Internal DNS & Service Discovery

- Internal suffix: `svc.internal`
- Services resolve to `127.0.0.1`
- DNS handled by agent-local DNS responder
- Fallback to `/etc/hosts` if split DNS unavailable
- Environment variables injected:
  - `SERVICE_<NAME>_URL=http://<name>.svc.internal`

Health checks always target direct localhost ports.

---

## 14. Observability

**Heartbeats**
- Regular full-state snapshots

**Events**
- Build, run, crash, config, and health transitions

---

## 15. Phase 0 Implementation Order

1. Control plane APIs
2. Agent bootstrap
3. Desired-state polling + heartbeat
4. External reverse proxy
5. Internal DNS + internal proxy
6. Git clone + run
7. Build + logs
8. Health checks
9. Security modes + firewall
10. Dashboard UI

---

## 16. What the MVP Looks Like

A user can:
- Define services in a dashboard
- Install an agent on a Linux server
- Choose a security posture (including zero inbound ports)
- Have apps automatically built and run
- Access apps through Cloudflare Tunnel or direct proxy
- Let services talk to each other via internal DNS
- Monitor everything centrally

This MVP delivers a **secure-by-default**, extensible foundation for future phases.