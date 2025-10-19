import type { Workflow } from 'cloudflare:workflows';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
};

export type SurfWorkflowParams = {
  messages: ChatMessage[];
  chatModel?: string | null;
  envSnapshot?: WorkflowEnvSnapshot | null;
};

export type SurfWorkflowResult = {
  response: string;
  model: string;
  systemPrompt: string;
};

export type WorkflowEnvSnapshot = {
  SANITY_PROJECT_ID?: string;
  SANITY_DATASET?: string;
  SANITY_API_VERSION?: string;
  SANITY_TOKEN?: string;
  SANITY_API_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  SURF_FORECAST_LOOKAHEAD_HOURS?: string;
  SURF_CONTEXT_TTL_MINUTES?: string;
};

export type Env = {
  AI: unknown;
  SURF_WORKFLOW: Workflow<SurfWorkflowParams>;
  CHAT_MODEL?: string;
  SANITY_PROJECT_ID?: string;
  SANITY_DATASET?: string;
  SANITY_API_VERSION?: string;
  SANITY_TOKEN?: string;
  SANITY_API_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  SURF_FORECAST_LOOKAHEAD_HOURS?: string;
  SURF_CONTEXT_TTL_MINUTES?: string;
};

export type SanitySurfSpot = {
  _id: string;
  name?: string;
  description?: string;
  region?: string;
  difficulty?: string;
  crowd?: string;
  typeOfBreak?: string[];
  idealWind?: string[];
  idealSwellDirection?: string[];
  swellSize?: string[];
  tideGuide?: string;
  hazards?: string[];
  seabed?: string[];
  waterQuality?: string;
};

export type RawForecastRow = {
  spot_id: string;
  forecast_time: string;
  swell_height?: number | null;
  swell_period?: number | null;
  swell_direction?: number | null;
  wave_height?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
};

export type ForecastQuality = 'GOOD' | 'FAIR' | 'POOR';

export type SimplifiedForecastPoint = {
  timeUtc: string;
  timeLocal: string;
  timestamp: number;
  swellHeightM: number | null;
  swellPeriodS: number | null;
  swellDirectionDeg: number | null;
  swellDirectionText: string | null;
  waveHeightM: number | null;
  windSpeedKph: number | null;
  windDirectionDeg: number | null;
  windDirectionText: string | null;
  quality: ForecastQuality;
};

export type SurfSpotContext = {
  id: string;
  name: string;
  region: string;
  description: string;
  difficulty: string;
  crowd: string;
  typeOfBreak: string[];
  idealWind: string[];
  idealSwellDirection: string[];
  swellSize: string[];
  tideGuide: string;
  hazards: string[];
  seabed: string[];
  idealWaterQuality: string;
  forecast: SimplifiedForecastPoint[];
  forecastCount: number;
  forecastStartUtc: string | null;
  forecastEndUtc: string | null;
};

export type SurfContextPayload = {
  generatedAtUtc: string;
  forecastHorizonHours: number;
  spots: SurfSpotContext[];
};
