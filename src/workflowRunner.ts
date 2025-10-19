import type { WorkflowInstance } from 'cloudflare:workflows';

import { generateSurfAdvice } from './surfAdvisor';
import type {
  ChatMessage,
  Env,
  SurfWorkflowParams,
  SurfWorkflowResult,
  WorkflowEnvSnapshot,
} from './types';

const POLL_INTERVAL_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForWorkflowCompletion(instance: WorkflowInstance): Promise<SurfWorkflowResult> {
  while (true) {
    const status = await instance.status();

    if (status.status === 'complete') {
      if (!status.output) {
        throw new Error('Workflow completed without output.');
      }
      return status.output as SurfWorkflowResult;
    }
    if (status.status === 'errored' || status.status === 'terminated') {
      throw new Error(status.error ?? 'Workflow failed.');
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

function buildEnvSnapshot(env: Env): WorkflowEnvSnapshot {
  return {
    SANITY_PROJECT_ID: env.SANITY_PROJECT_ID,
    SANITY_DATASET: env.SANITY_DATASET,
    SANITY_API_VERSION: env.SANITY_API_VERSION,
    SANITY_TOKEN: env.SANITY_TOKEN,
    SANITY_API_TOKEN: env.SANITY_API_TOKEN,
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_KEY: env.SUPABASE_KEY,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    SURF_FORECAST_LOOKAHEAD_HOURS: env.SURF_FORECAST_LOOKAHEAD_HOURS,
    SURF_CONTEXT_TTL_MINUTES: env.SURF_CONTEXT_TTL_MINUTES,
  };
}

export async function executeSurfWorkflow(env: Env, messages: ChatMessage[]): Promise<SurfWorkflowResult> {
  if (!env.SURF_WORKFLOW?.create) {
    console.warn('SURF_WORKFLOW binding unavailable; generating advice inline.');
    return generateSurfAdvice(env, messages);
  }

  const params: SurfWorkflowParams = {
    messages,
    chatModel: env.CHAT_MODEL?.trim() ?? null,
    envSnapshot: buildEnvSnapshot(env),
  };

  try {
    const instance = await env.SURF_WORKFLOW.create({ params });
    return await waitForWorkflowCompletion(instance);
  } catch (error) {
    console.error('Workflow execution failed, falling back to inline generation', error);
    return generateSurfAdvice(env, messages);
  }
}
