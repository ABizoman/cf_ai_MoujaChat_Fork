export type WorkflowEvent<T> = {
  payload: T;
  timestamp: Date;
  instanceId: string;
};

export type WorkflowInstanceState<T = unknown> = {
  status:
    | 'queued'
    | 'running'
    | 'paused'
    | 'errored'
    | 'terminated'
    | 'complete'
    | 'waiting'
    | 'waitingForPause'
    | 'unknown';
  error?: string;
  output?: unknown;
  params?: T;
};

export class WorkflowStep {
  async do<T>(name: string, configOrCallback: any, maybeCallback?: () => Promise<T>): Promise<T> {
    const callback = typeof configOrCallback === 'function' ? configOrCallback : maybeCallback;
    if (!callback) {
      throw new Error('WorkflowStep.do requires a callback when used in tests');
    }
    return callback();
  }
}

export class WorkflowEntrypoint<Env = unknown, Params = unknown> {
  protected env: Env;

  constructor(_ctx: unknown, env: Env) {
    this.env = env;
  }

  // Subclasses provide implementation in production. Tests should mock run when needed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(_event: WorkflowEvent<Params>, _step: WorkflowStep): Promise<unknown> {
    throw new Error('WorkflowEntrypoint.run is not implemented in test stub.');
  }
}

export class WorkflowInstance<Params = unknown> {
  constructor(private readonly getter: () => Promise<WorkflowInstanceState<Params>>) {}

  status(): Promise<WorkflowInstanceState<Params>> {
    return this.getter();
  }
}

export class Workflow<Params = unknown> {
  constructor(private readonly factory: (options?: { params?: Params }) => Promise<WorkflowInstance<Params>>) {}

  create(options?: { params?: Params }): Promise<WorkflowInstance<Params>> {
    return this.factory(options);
  }
}
