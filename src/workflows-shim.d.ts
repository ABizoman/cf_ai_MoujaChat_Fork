declare module 'cloudflare:workflows' {
  export type WorkflowEvent<T> = {
    payload: Readonly<T>;
    timestamp: Date;
    instanceId: string;
  };

  export type WorkflowStepConfig = {
    retries?: {
      limit: number;
      delay: number | string;
      backoff?: 'constant' | 'linear' | 'exponential';
    };
    timeout?: number | string;
  };

  export abstract class WorkflowStep {
    do<T>(name: string, callback: () => Promise<T>): Promise<T>;
    do<T>(name: string, config: WorkflowStepConfig, callback: () => Promise<T>): Promise<T>;
  }

  export abstract class WorkflowEntrypoint<Env = unknown, Params = unknown> {
    protected env: Env;
    constructor(ctx: ExecutionContext, env: Env);
    abstract run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown>;
  }

  export abstract class Workflow<PARAMS = unknown> {
    create(options?: { id?: string; params?: PARAMS }): Promise<WorkflowInstance<PARAMS>>;
  }

  export type WorkflowInstanceStatus = 'queued' | 'running' | 'paused' | 'errored' | 'terminated' | 'complete' | 'waiting' | 'waitingForPause' | 'unknown';

  export type WorkflowInstanceState<PARAMS = unknown> = {
    status: WorkflowInstanceStatus;
    error?: string;
    output?: unknown;
    params?: PARAMS;
  };

  export abstract class WorkflowInstance<PARAMS = unknown> {
    id: string;
    status(): Promise<WorkflowInstanceState<PARAMS>>;
  }
}
