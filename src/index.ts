import { CHAT_WEB_HTML } from './chatWeb';
import type { ChatRequest, Env } from './types';
import { executeSurfWorkflow } from './workflowRunner';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;

    if (method === 'GET' || method === 'HEAD') {
      if (url.pathname === '/' || url.pathname === '/chat') {
        return new Response(method === 'HEAD' ? null : CHAT_WEB_HTML, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      }
      return new Response('Not Found', { status: 404 });
    }

    if (method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (!env.AI || !env.SURF_WORKFLOW) {
      return new Response('Service bindings are not configured', { status: 500 });
    }

    let payload: ChatRequest;
    try {
      payload = (await request.json()) as ChatRequest;
    } catch (_error) {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return new Response('The "messages" array is required', { status: 400 });
    }

    console.log('Incoming chat request', JSON.stringify(payload.messages));

    let responseText: string;
    try {
      const workflowResult = await executeSurfWorkflow(env, payload.messages);
      console.log('Workflow result metadata', {
        model: workflowResult.model,
        systemPromptLength: workflowResult.systemPrompt.length,
      });
      responseText = workflowResult.response;
    } catch (error) {
      console.error('Chat workflow execution failed', error);
      responseText =
        'Sorry, the surf assistant ran into an issue generating a recommendation. Please try again shortly.';
    }

    const line = JSON.stringify({ response: responseText }) + '\n';
    return new Response(line, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  },
};

export { SurfAdvisorWorkflow } from './workflow';
