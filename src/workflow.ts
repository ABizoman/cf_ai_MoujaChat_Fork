import * as Workflows from 'cloudflare:workflows';
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workflows';

import { generateSurfAdvice } from './surfAdvisor';
import type { Env, SurfWorkflowParams, SurfWorkflowResult } from './types';

type WorkflowEntrypointCtor = new (ctx: unknown, env: Env) => { env: Env };

const WorkflowBase: WorkflowEntrypointCtor =
  ((Workflows as { WorkflowEntrypoint?: WorkflowEntrypointCtor }).WorkflowEntrypoint as WorkflowEntrypointCtor) ??
  class FallbackWorkflowEntrypoint {
    protected env: Env;
    constructor(_ctx: unknown, env: Env) {
      this.env = env;
    }
  };

export class SurfAdvisorWorkflow extends WorkflowBase {
  protected env!: Env;
  async run(event: WorkflowEvent<SurfWorkflowParams>, step: WorkflowStep): Promise<SurfWorkflowResult> {
    const mergedEnv: Env = {
      ...this.env,
      ...(event.payload.envSnapshot ?? {}),
    } as Env;

    // Preserve original AI binding if snapshot lacks it.
    mergedEnv.AI = this.env.AI;
    mergedEnv.SURF_WORKFLOW = this.env.SURF_WORKFLOW;

    return generateSurfAdvice(mergedEnv, event.payload.messages, step);
  }
}
