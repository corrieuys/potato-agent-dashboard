/// <reference path="../worker-configuration.d.ts" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import routes
import htmlRoutes from "./routes/html";
import stacksRoutes from "./routes/stacks";
import servicesRoutes from "./routes/services";
import agentsRoutes from "./routes/agents";
import desiredStateRoutes from "./routes/desired-state";
import heartbeatRoutes from "./routes/heartbeat";
import webhooksRoutes from "./routes/webhooks";
import versionsRoutes from "./routes/versions";

// Create main app
const app = new Hono<{ Bindings: CloudflareBindings }>();

// Global middleware
app.use("*", cors({
  origin: ["https://app.potatocloud.space"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Agent-Id", "HX-Request", "HX-Target", "HX-Trigger"],
  credentials: true,
}));
app.use("*", logger());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Mount HTML routes (dashboard UI)
app.route("/", htmlRoutes);

// Mount API routes
app.route("/api/stacks", stacksRoutes);
app.route("/api/stacks/:stackId/services", servicesRoutes);
app.route("/api/stacks/:stackId/agents", agentsRoutes);
app.route("/api/stacks/:stackId/desired-state", desiredStateRoutes);
app.route("/api/stacks/:stackId/webhooks", webhooksRoutes);
app.route("/api/stacks/:stackId/services/:serviceId/versions", versionsRoutes);
app.route("/api/agents/heartbeat", heartbeatRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
