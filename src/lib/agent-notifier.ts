// Agent notification utility
// This module provides functions to notify agents about configuration changes

export interface AgentNotificationPayload {
  stack_id: string;
  stack_version: number;
  changed_at: string;
  change_type: 'git_push' | 'service_update' | 'config_change' | 'manual_trigger';
  service_id?: string;
  commit_ref?: string;
}

/**
 * Notify a specific agent about configuration changes
 */
export async function notifyAgent(
  agentEndpoint: string,
  payload: AgentNotificationPayload,
  apiKey?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${agentEndpoint}/api/internal/notify-config-change`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Notify all agents in a stack about configuration changes
 */
export async function notifyStackAgents(
  db: any,
  stackId: string,
  payload: Omit<AgentNotificationPayload, 'stack_id'>,
  apiKey?: string
): Promise<{ notified: number; failed: number; errors: string[] }> {
  const { eq } = await import('drizzle-orm');
  const { agents } = await import('../db/schema');

  // Get all online agents with endpoints configured
  const stackAgents = await db
    .select({
      id: agents.id,
      agentEndpoint: agents.agentEndpoint,
    })
    .from(agents)
    .where(eq(agents.stackId, stackId));

  const results = {
    notified: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const agent of stackAgents) {
    if (!agent.agentEndpoint) {
      continue; // Skip agents without endpoint configured
    }

    const result = await notifyAgent(
      agent.agentEndpoint,
      { ...payload, stack_id: stackId },
      apiKey
    );

    if (result.success) {
      results.notified++;
    } else {
      results.failed++;
      results.errors.push(`Agent ${agent.id}: ${result.error}`);
    }
  }

  return results;
}