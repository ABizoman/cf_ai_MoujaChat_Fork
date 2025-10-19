# Context & Idea

https://github.com/user-attachments/assets/2cb3a2b5-10b6-4ff7-98fd-5b88b966ffda


I'm currently developing a full-stack, cross-platform application for a tourism startup called [Mouja](https://mouja.ma).  
Mouja offers digital booking services for local businesses that currently lack an online presence, alongside advanced surf forecasting for over 3000 km of the Moroccan coastline.

While surf forecasting apps like Surfline or Windguru already exist, they often require users to interpret complex data and oceanographic indicators to understand **when** and **where** to surf. This creates a high barrier to entry for beginners.

Mouja aims to solve this problem through an **AI Assistant** that automatically reads and interprets forecasts for nearby surf spots, comparing them with detailed, curated information from our database.  
Each spot’s **preset information** includes key details such as ideal surf conditions, access points, water quality, parking availability, and potential hazards.  
The model combines these insights to advise users on the best places and times to surf — essentially acting like a knowledgeable surfer friend who always knows what the sea is doing.

This chat experience is powered by a **lightweight Cloudflare Worker**, which receives the user’s chat history, calls **Cloudflare Workers AI**, and streams newline-delimited JSON responses to the Expo app in real time.  
Cloudflare was chosen for its **global edge network**, **low latency**, and **built-in AI inference capabilities**, enabling scalable, low-cost, and fast interaction without needing to maintain backend servers. This setup aligns perfectly with the real-time, chat-driven nature of the app.

As the app’s content is confidential, I’ve forked the private section of the repository for demonstration purposes and built an HTML demo page that simulates the in-app chat experience.

Here is the demo [link](https://mouja-chat-worker.zoom-bushes-0u.workers.dev)

# Important Note

Although this code passes basic tests, several architectural improvements are needed before production deployment:

- As the number of surf spots in the database grows, the input token count for the chat model will become too large — increasing latency, costs, and potentially exceeding the model’s maximum token limit (25K tokens).

To mitigate this, as the app scales with **more users and more surf spots**, we can take advantage of recurring patterns in user queries — most people ask similar questions like *“when to surf,” “where,” “why,”* and *“how are the waves?”* Instead of having the chat model process all forecasts for every query, a **larger model** (with a higher token limit) could periodically generate an **overview of surf conditions** for each city or region — for example, a few times a day. The **chat worker** would then reference these summaries instead of sending the entire surf forecast dataset in the prompt each time.  

To maintain precision, the chat model could still fetch **specific data** for the top recommended spots, ensuring the final answer remains accurate while keeping the token count low. This hybrid approach combines broad context from the large model with focused, lightweight queries for personalized responses.


## How the AI Assignment Requirements Are Met

| Requirement | Implementation |
|-------------|----------------|
| **LLM** | Cloudflare Workers AI running the `@cf/meta/llama-3.3-70b-instruct-fp8-fast` model. The worker augments each request with real surf context before invoking the model. |
| **Workflow / coordination** | A Cloudflare Workflow (`SurfAdvisorWorkflow`) orchestrates the surf-context fetch step and the model call. The worker falls back to inline execution when the workflow binding is unavailable, but production runs through the workflow. |
| **User input via chat** | `ReactApp/app/AI_Chat/chat.tsx` provides a chat UI (mobile/web) that streams conversation history to the worker. The worker responds with Markdown rendered in the client. |
| **Memory / state** | Surf context is cached in the worker (`getSurfSystemPrompt`) using TTLs, ensuring consecutive requests reuse fresh data. Conversation history is maintained client-side and re-sent each turn. Forecast and spot metadata are sourced from Sanity/Supabase, giving the assistant durable knowledge beyond a single call. |


## Prerequisites

- Install [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update) for deploying Cloudflare Workers.

```bash
npm install -g wrangler
```

- Ensure you have a Cloudflare account with Workers enabled.

## Configuration

Configure `wrangler.toml` to match the Worker entrypoint and bindings used by this project:

```toml
name = "mouja-chat-worker"
main = "src/index.ts"
compatibility_date = "2025-10-19"

[ai]
binding = "AI"

[[workflows]]
name = "surf-advisor"
binding = "SURF_WORKFLOW"
class_name = "SurfAdvisorWorkflow"
```

When you deploy to your own account, add the usual deployment fields (for example `account_id`, `workers_dev` or `routes`, and environment-specific overrides) as needed.

### Surf data integrations

Set the following environment variables in your Cloudflare dashboard or `.env` file:

- `SURF_FORECAST_API_KEY` - API key for surf forecast data provider.
- `SURF_SPOTS_DATA_URL` - URL or endpoint to fetch surf spots data.
- `OPENAI_API_KEY` - (Optional) if integrating OpenAI services.
- `CLOUDFLARE_API_TOKEN` - Token for Cloudflare API access if needed.

## Local development

To run the worker locally with live reload:

```bash
npm run dev
```

This will start a local server and expose a tunnel URL you can use for testing.

## Deploy

To publish your worker to Cloudflare:

```bash
npm run deploy
```

This command uses Wrangler to build and deploy the worker to your configured environment.

## Error handling

- **API rate limits**: If surf forecast APIs or AI services hit rate limits, the worker returns an error message prompting to retry later.
- **Invalid user input**: The worker validates chat input and returns friendly error messages if the input is malformed.
- **Timeouts**: If external API calls exceed time limits, the worker aborts and returns a timeout error to the client.
- **Unexpected errors**: General try-catch blocks ensure that unexpected exceptions return a generic error response without leaking sensitive info.
