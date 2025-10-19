This is a document dedicated to showing the Extent of AI use to build this PoC project by showing eevery prompt used to build it.

These prompts were run through **OpenAI's Codex IDE** extension using ChatGPT 5 codex models.

Some of the prompts used for research (how to do thing x in language x?) or debugging are not in this document.
This document illustrates the prompts that were used for **code generation** and **code modification** in this project.


1. pls init a repo with only one package called chat-backend. setup a src dir, testing dir, package json and get typescript + vitest installed. no react files here.

2. configure wrangler.toml for a modules worker named mouja-chat-worker, point main to src/index.ts, set compat date to today. also add ai binding called AI + workflow binding SURF_WORKFLOW hookup to SurfAdvisorWorkflow.

3. create tsconfig, vitest config (mock cloudflare:workflows import), and a basic src/index.ts that replies hello world for GET /. make sure build uses es module output cause workers.

4. write src/constants.ts with defaults for model id, forecast horizon hours, cache ttl etc. include export type Env with AI binding, SURF_WORKFLOW, sanity + supabase creds pulled from env.

5. add src/types.ts: ChatMessage, ChatRequest, SurfWorkflowParams, SurfWorkflowResult, WorkflowEnvSnapshot, SanityDoc, ForecastReading. keep it simple but enough fields used later.


6. break out helpers inside same file or new src/utils.ts to normalize forecast units, guard against missing fields, provide assertEnvVar helper so we crash loud when env missing.

7. write src/chatWeb.ts (or rename) that calls env.AI.run with `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, pass system prompt + message history. handle tool errors n return {response, model, systemPrompt}.

8. rewrite src/index.ts so GET / serves page.html demo, POST / expects {messages}, builds env snapshot, calls executeSurfWorkflow, streams newline separated json chunks to client. use Response constructor with readableStream.

9. fill src/page.html with plain html+js, shows textarea + button, streams fetch results line by line. keep it ugly but working. copy the look of the view @ReactApp/App/chat/chat.tsx

10. under testing/ write vitest suites: constants.test.ts verifying defaults, surfContext fetcher with mocked fetch, workflow runner fallback, index handler with fake executeSurfWorkflow. mock env objects manually.

11. draft .dev.vars template with SANITY_PROJECT_ID, SANITY_DATASET, SUPABASE_URL, SUPABASE_ANON_KEY etc. mention they need real values.


