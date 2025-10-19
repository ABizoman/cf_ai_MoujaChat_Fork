import { Ai } from '@cloudflare/ai';
import type { WorkflowStep } from 'cloudflare:workflows';

import { DEFAULT_CHAT_MODEL } from './constants';
import { buildFallbackPrompt } from './prompts';
import { extractResponseText } from './response';
import { getSurfSystemPrompt } from './surfContext';
import type { ChatMessage, Env, SurfWorkflowResult } from './types';

type ModelParam = Parameters<InstanceType<typeof Ai>['run']>[0];

async function resolveSystemPrompt(env: Env, step?: WorkflowStep): Promise<string> {
  const action = async () => {
    try {
      return await getSurfSystemPrompt(env);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown surf context error';
      console.error('Surf context generation failed', error);
      return buildFallbackPrompt(message);
    }
  };

  if (step) {
    return step.do('build-surf-context', action);
  }
  return action();
}

async function invokeModel(
  env: Env,
  model: ModelParam,
  messages: ChatMessage[],
  step?: WorkflowStep,
): Promise<unknown> {
  const action = async () => {
    const ai = new Ai(env.AI);
    return ai.run(model, { messages, max_tokens: 512 });
  };

  if (step) {
    return step.do('invoke-ai', action);
  }
  return action();
}

export async function generateSurfAdvice(
  env: Env,
  history: ChatMessage[],
  step?: WorkflowStep,
): Promise<SurfWorkflowResult> {
  const systemPrompt = await resolveSystemPrompt(env, step);
  const modelId = (env.CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL) as ModelParam;

  const augmentedMessages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...history,
  ];

  const aiResponse = await invokeModel(env, modelId, augmentedMessages, step);
  console.log('Surf advisor AI result', aiResponse);

  return {
    response: extractResponseText(aiResponse),
    model: modelId,
    systemPrompt,
  };
}
