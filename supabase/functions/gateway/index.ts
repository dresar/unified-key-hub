import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Provider {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  priority: number;
  enabled: boolean;
}

interface ApiKey {
  id: string;
  provider_id: string;
  name: string;
  encrypted_key: string;
  status: string;
  priority: number;
}

interface GatewayRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// Map model names to providers
const modelToProvider: Record<string, string> = {
  "gemini-1.5-flash": "gemini",
  "gemini-1.5-pro": "gemini",
  "gemini-2.0-flash": "gemini",
  "llama-3.1-70b": "groq",
  "llama-3.1-8b": "groq",
  "mixtral-8x7b": "groq",
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  "gpt-4": "openai",
  "claude-3-opus": "anthropic",
  "claude-3-sonnet": "anthropic",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const requestBody: GatewayRequest = await req.json();
    const { model, messages, stream = false, temperature = 0.7, max_tokens = 2048 } = requestBody;

    // Get all enabled providers ordered by priority
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: true });

    if (providersError || !providers?.length) {
      throw new Error("No providers available");
    }

    // Determine which provider to try first based on model
    let targetProviderSlug = model ? modelToProvider[model] : null;
    let orderedProviders = providers as Provider[];
    
    if (targetProviderSlug) {
      // Move the target provider to the front
      orderedProviders = [
        ...providers.filter((p: Provider) => p.slug === targetProviderSlug),
        ...providers.filter((p: Provider) => p.slug !== targetProviderSlug),
      ];
    }

    // Try each provider until one succeeds
    for (const provider of orderedProviders) {
      // Get active keys for this provider
      const { data: keys, error: keysError } = await supabase
        .from("api_keys")
        .select("*")
        .eq("provider_id", provider.id)
        .eq("status", "active")
        .order("priority", { ascending: true });

      if (keysError || !keys?.length) {
        console.log(`No active keys for provider ${provider.name}, trying next...`);
        continue;
      }

      // Try each key in this provider
      for (const key of keys as ApiKey[]) {
        try {
          const response = await callProvider(provider, key, {
            model: model || getDefaultModel(provider.slug),
            messages,
            stream,
            temperature,
            max_tokens,
          });

          // Log successful request
          const latency = Date.now() - startTime;
          await logRequest(supabase, {
            provider_id: provider.id,
            api_key_id: key.id,
            endpoint: "/v1/chat/completions",
            method: "POST",
            status_code: 200,
            latency_ms: latency,
            request_size: JSON.stringify(requestBody).length,
            response_size: response.length,
          });

          // Update key usage
          await supabase
            .from("api_keys")
            .update({
              requests_today: (key as any).requests_today + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq("id", key.id);

          return new Response(response, {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error(`Key ${key.name} failed:`, error.message);

          // Check if quota exceeded
          if (error.status === 429 || error.message?.includes("quota")) {
            // Mark key as exhausted
            await supabase
              .from("api_keys")
              .update({ status: "exhausted" })
              .eq("id", key.id);
            console.log(`Key ${key.name} marked as exhausted, trying next...`);
          }

          // Log failed request
          await logRequest(supabase, {
            provider_id: provider.id,
            api_key_id: key.id,
            endpoint: "/v1/chat/completions",
            method: "POST",
            status_code: error.status || 500,
            latency_ms: Date.now() - startTime,
            error_message: error.message,
          });

          // Continue to next key
          continue;
        }
      }
    }

    // All providers/keys exhausted
    return new Response(
      JSON.stringify({
        error: "All API keys exhausted",
        message: "No available keys could process this request. Please add more keys or wait for quota reset.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Gateway error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDefaultModel(providerSlug: string): string {
  const defaults: Record<string, string> = {
    gemini: "gemini-1.5-flash",
    groq: "llama-3.1-70b-versatile",
    openai: "gpt-4o-mini",
    anthropic: "claude-3-sonnet-20240229",
  };
  return defaults[providerSlug] || "gemini-1.5-flash";
}

async function callProvider(
  provider: Provider,
  key: ApiKey,
  request: GatewayRequest
): Promise<string> {
  let url: string;
  let headers: Record<string, string>;
  let body: string;

  switch (provider.slug) {
    case "gemini":
      url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${key.encrypted_key}`;
      headers = { "Content-Type": "application/json" };
      body = JSON.stringify({
        contents: request.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.max_tokens,
        },
      });
      break;

    case "groq":
      url = "https://api.groq.com/openai/v1/chat/completions";
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.encrypted_key}`,
      };
      body = JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      });
      break;

    case "openai":
    default:
      url = `${provider.base_url}/v1/chat/completions`;
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.encrypted_key}`,
      };
      body = JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      });
      break;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText) as any;
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  // Normalize response to OpenAI format
  if (provider.slug === "gemini") {
    return JSON.stringify({
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
          },
          finish_reason: "stop",
        },
      ],
      provider: provider.slug,
      key_used: key.name,
    });
  }

  // Add metadata for other providers
  return JSON.stringify({
    ...data,
    provider: provider.slug,
    key_used: key.name,
  });
}

async function logRequest(
  supabase: any,
  log: {
    provider_id: string;
    api_key_id: string;
    endpoint: string;
    method: string;
    status_code: number;
    latency_ms: number;
    request_size?: number;
    response_size?: number;
    error_message?: string;
  }
) {
  try {
    await supabase.from("request_logs").insert(log);
  } catch (error) {
    console.error("Failed to log request:", error);
  }
}
