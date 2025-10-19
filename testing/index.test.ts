import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Workflow } from 'cloudflare:workflows';

import type { ChatRequest, Env, SurfWorkflowParams, SurfWorkflowResult } from '../src/types';

const executeSurfWorkflowMock = vi.fn<
  (env: Env, messages: ChatRequest['messages']) => Promise<SurfWorkflowResult>
>();

vi.mock('../src/workflowRunner', () => ({
  executeSurfWorkflow: executeSurfWorkflowMock,
}));

vi.mock('../src/chatWeb', () => ({
  CHAT_WEB_HTML: '<html>mock</html>',
}));

const workerModulePromise = import('../src/index');

describe('worker fetch handler', () => {
  let worker: Awaited<typeof workerModulePromise>['default'];

  beforeEach(async () => {
    ({ default: worker } = await workerModulePromise);
    executeSurfWorkflowMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const baseEnv: Env = {
    AI: {},
    SURF_WORKFLOW: {} as Workflow<SurfWorkflowParams>,
  };

  it('serves HTML for GET requests', async () => {
    const response = await worker.fetch(new Request('https://example.com', { method: 'GET' }), {} as Env);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('mock');
  });

  it('returns error when service bindings missing', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const response = await worker.fetch(request, {} as Env);
    expect(response.status).toBe(500);
  });

  it('handles invalid JSON payloads', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await worker.fetch(request, baseEnv);
    expect(response.status).toBe(400);
    expect(executeSurfWorkflowMock).not.toHaveBeenCalled();
  });

  it('validates that messages array is present', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ messages: [] as ChatRequest['messages'] }),
    });
    const response = await worker.fetch(request, baseEnv);
    expect(response.status).toBe(400);
    expect(executeSurfWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns workflow response payload', async () => {
    executeSurfWorkflowMock.mockResolvedValue({
      response: 'generated-response',
      model: 'test',
      systemPrompt: 'prompt',
    });

    const request = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });

    const response = await worker.fetch(request, baseEnv);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(executeSurfWorkflowMock).toHaveBeenCalledTimes(1);
    expect(body).toBe('{"response":"generated-response"}\n');
  });

  it('returns fallback message when workflow fails', async () => {
    executeSurfWorkflowMock.mockRejectedValue(new Error('boom'));

    const request = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });

    const response = await worker.fetch(request, baseEnv);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('Sorry, the surf assistant ran into an issue');
  });
});
