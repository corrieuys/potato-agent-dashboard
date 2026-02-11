import { Hono } from "hono";
import { eq, desc, and, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, services, stackJwts, serviceVersions } from "../db/schema";
import { generateUUID, parseBody } from "../lib/utils";
import { notifyStackAgents } from "../lib/agent-notifier";
import crypto from "crypto";

const webhooksRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Helper function to verify admin API key
async function verifyAdminAccess(db: any, stackId: string, apiKey: string | undefined): Promise<boolean> {
  if (!apiKey || !stackId) return false;
  const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));
  return !!stack;
}

// Helper function to validate JWT token
async function validateJwtToken(db: any, stackId: string, token: string): Promise<boolean> {
  const [jwt] = await db
    .select()
    .from(stackJwts)
    .where(and(eq(stackJwts.stackId, stackId), eq(stackJwts.token, token)));

  if (!jwt || !jwt.active) return false;
  if (jwt.expiresAt && Date.now() > jwt.expiresAt) return false;

  // Update last used time
  await db
    .update(stackJwts)
    .set({ lastUsedAt: Date.now() })
    .where(eq(stackJwts.id, jwt.id));

  return true;
}

// Generate a new JWT for a stack (admin only)
webhooksRoutes.post("/jwt/generate", async (c) => {
  const db = createClient(c.env.DB);
  const stackId = c.req.param("stackId");
  const apiKey = c.req.header("X-API-Key");
  const body = await parseBody(c);
  const description = body.description;
  const expiresInMinutes = parseInt(body.expires_in_minutes || "0");

  if (!stackId) {
    return c.json({ error: "Stack ID required" }, 400);
  }

  const hasAccess = await verifyAdminAccess(db, stackId, apiKey);
  if (!hasAccess) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Generate JWT token (32-byte hex string)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = expiresInMinutes > 0 ? Date.now() + expiresInMinutes * 60 * 1000 : null;

  await db.insert(stackJwts).values({
    id: generateUUID(),
    stackId,
    token,
    description: description || `Webhook JWT - ${new Date().toISOString()}`,
    expiresAt,
    createdAt: Date.now(),
    lastUsedAt: null,
    active: true,
  } as any);

  return c.json({
    token,
    expires_at: expiresAt,
    message: "Store this token securely - it will not be shown again",
  });
});

// List all JWTs for a stack (admin only)
webhooksRoutes.get("/jwt/list", async (c) => {
  const db = createClient(c.env.DB);
  const stackId = c.req.param("stackId");
  const apiKey = c.req.header("X-API-Key");

  if (!stackId) {
    return c.json({ error: "Stack ID required" }, 400);
  }

  const hasAccess = await verifyAdminAccess(db, stackId, apiKey);
  if (!hasAccess) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const jwts = await db
    .select({
      id: stackJwts.id,
      stackId: stackJwts.stackId,
      description: stackJwts.description,
      createdAt: stackJwts.createdAt,
      expiresAt: stackJwts.expiresAt,
      lastUsedAt: stackJwts.lastUsedAt,
      active: stackJwts.active,
    })
    .from(stackJwts)
    .where(eq(stackJwts.stackId, stackId))
    .orderBy(desc(stackJwts.createdAt));

  return c.json({ jwts });
});

// Revoke a JWT (admin only)
webhooksRoutes.post("/jwt/revoke", async (c) => {
  const db = createClient(c.env.DB);
  const stackId = c.req.param("stackId");
  const apiKey = c.req.header("X-API-Key");
  const body = await parseBody(c);
  const jwtId = body.jwt_id;

  if (!stackId || !jwtId) {
    return c.json({ error: "Stack ID and JWT ID required" }, 400);
  }

  const hasAccess = await verifyAdminAccess(db, stackId, apiKey);
  if (!hasAccess) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(stackJwts)
    .set({ active: false })
    .where(eq(stackJwts.id, jwtId));

  return c.json({ success: true });
});

// GitHub webhook endpoint - receives push events
webhooksRoutes.post("/github", async (c) => {
  const db = createClient(c.env.DB);
  const stackId = c.req.param("stackId");

  if (!stackId) {
    return c.json({ error: "Stack ID required" }, 400);
  }

  // Validate JWT from Authorization header
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.substring(7);
  const isValid = await validateJwtToken(db, stackId, token);
  if (!isValid) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  // Parse GitHub webhook payload
  const body = await parseBody(c);

  // Validate it's a push event
  if (!body.ref || !body.head_commit) {
    return c.json({ error: "Invalid GitHub push event payload" }, 400);
  }

  const branch = body.ref.replace("refs/heads/", "");
  const commitSha = body.head_commit.id;
  const repoUrl = body.repository?.clone_url || body.repository?.html_url;

  // Get services that match this stack and git URL
  const stackServices = await db
    .select()
    .from(services)
    .where(eq(services.stackId, stackId));

  let updatedCount = 0;
  const updatedServices: Array<{ id: string; name: string; blueGreenMode: boolean }> = [];

  for (const service of stackServices) {
    // Check if the service's git URL matches the webhook's repo URL
    // and if the branch matches the service's git ref
    if (
      service.gitUrl &&
      repoUrl &&
      (service.gitUrl === repoUrl ||
        service.gitUrl.replace(".git", "") === repoUrl.replace(".git", ""))
    ) {
      if (service.gitRef === branch) {
        // Get next version number
        const [lastVersion] = await db
          .select()
          .from(serviceVersions)
          .where(eq(serviceVersions.serviceId, service.id))
          .orderBy(desc(serviceVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

        // Create new version entry
        const versionId = generateUUID();
        await db.insert(serviceVersions).values({
          id: versionId,
          serviceId: service.id,
          stackId,
          commitRef: commitSha,
          versionNumber: nextVersionNumber,
          status: "pending",
          healthy: false,
          isActive: false,
          createdAt: Date.now(),
        } as any);

        if (service.blueGreenMode) {
          // In blue-green mode, update the inactive slot
          const inactiveSlot = service.activeVersionSlot === "blue" ? "green" : "blue";
          const updateData: any = {
            updatedAt: sql`CURRENT_TIMESTAMP`,
          };

          if (inactiveSlot === "blue") {
            updateData.blueVersionId = versionId;
          } else {
            updateData.greenVersionId = versionId;
          }

          await db
            .update(services)
            .set(updateData)
            .where(eq(services.id, service.id));
        } else {
          // In normal mode, update git commit directly
          await db
            .update(services)
            .set({ gitCommit: commitSha, updatedAt: sql`CURRENT_TIMESTAMP` })
            .where(eq(services.id, service.id));
        }

        updatedCount++;
        updatedServices.push({
          id: service.id,
          name: service.name,
          blueGreenMode: service.blueGreenMode,
        });

        // Clean up old versions (keep only last 10)
        const oldVersions = await db
          .select({ id: serviceVersions.id })
          .from(serviceVersions)
          .where(eq(serviceVersions.serviceId, service.id))
          .orderBy(desc(serviceVersions.versionNumber))
          .offset(10);

        for (const oldVersion of oldVersions) {
          await db
            .delete(serviceVersions)
            .where(eq(serviceVersions.id, oldVersion.id));
        }
      }
    }
  }

  // Get updated stack version after service updates
  const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));

  // Notify all agents in the stack about the config change
  let notificationResults = null;
  if (updatedCount > 0 && stack) {
    notificationResults = await notifyStackAgents(
      db,
      stackId,
      {
        stack_version: stack.version,
        changed_at: new Date().toISOString(),
        change_type: 'git_push',
        commit_ref: commitSha,
      },
      {
        accessClientId: c.env.CF_ACCESS_CLIENT_ID,
        accessClientSecret: c.env.CF_ACCESS_CLIENT_SECRET,
      }
    );
  }

  return c.json({
    success: true,
    message: `Updated ${updatedCount} service(s) with new commit ${commitSha}`,
    commit: commitSha,
    branch,
    notifications: notificationResults,
  });
});

export default webhooksRoutes;
