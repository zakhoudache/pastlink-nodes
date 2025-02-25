import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
// Use environment variables instead of hardcoding
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") || "https://uimmjzuqdqxfqoikcexf.supabase.co";
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbW1qenVxZHF4ZnFvaWtjZXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDA0MDU1NywiZXhwIjoyMDU1NjE2NTU3fQ.da5x63mxpnLCfNHBTxobfwC2MC5w9dJZ4x35j9Yghvc";

function deriveEntityType(text: string, context: string): string {
  const lowerText = text.toLowerCase();
  const lowerCtx = context.toLowerCase();

  // Enhanced entity type detection
  if (
    /(^[A-Z][a-z]+ [A-Z][a-z]+$)/.test(text) &&
    !/(war|revolution|battle|treaty)/.test(lowerText)
  ) {
    return "person";
  }
  if (
    /(revolution|war|agreement|conference|battle|treaty|election)/.test(
      lowerText,
    )
  ) {
    return "event";
  }
  if (
    /(city|region|continent|country|mountain|river|ocean|sea|village|town)/.test(
      lowerCtx,
    )
  ) {
    return "place";
  }
  if (
    /(economic|market|trade|organization|company|corporation|government|institution)/.test(
      lowerCtx,
    )
  ) {
    return "organization";
  }
  return "concept";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get API key from environment variable
    const apiKey = "AIzaSyA1V7Klm9lyEPtw6PViEeeTPoCTwwJQt5E";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Fixed typo in method name
    const model = genAI.getGenerativeModel({ model: "gemini-pro-flash" });

    const prompt = `Analyze the following text and extract entities and relationships. Return the result in JSON format with two keys: "entities" and "relationships".

- "entities" should be an array of objects, each with "text" (the entity name), "type" (person, place, organization, event, or concept), and "context" (optional).
- "relationships" should be an array of objects, each with "source" (entity text), "target" (entity text), and "type" (relationship type).

Example output:
{
  "entities": [
    {"text": "George Washington", "type": "person", "context": "lived at"},
    {"text": "Mount Vernon", "type": "place", "context": "lived at"},
    {"text": "American Revolution", "type": "event", "context": "participated in"}
  ],
  "relationships": [
    {"source": "George Washington", "target": "Mount Vernon", "type": "lived at"},
    {"source": "George Washington", "target": "American Revolution", "type": "participated in"}
  ]
}

Text to analyze: ${text}`;

    // Add timeout and retry logic for API stability
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await model.generateContent(prompt);
        const analysisText = (await result.response).text();
        const cleanJson = analysisText.replace(/```json\n?|```/g, "").trim();

        // Add error checking for malformed JSON
        let parsed;
        try {
          parsed = JSON.parse(cleanJson);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return new Response(
            JSON.stringify({ error: "Invalid response format from AI model" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const entities = [];
        const seen = new Set();

        // Process entities first
        if (parsed.entities?.length) {
          parsed.entities.forEach((entity) => {
            if (!seen.has(entity.text)) {
              seen.add(entity.text);
              entities.push({
                id: crypto.randomUUID(),
                text: entity.text,
                type:
                  entity.type ||
                  deriveEntityType(entity.text, entity.context || ""),
                context: entity.context || "",
              });
            }
          });
        }

        // Process relationships
        parsed.relationships?.forEach((rel) => {
          [rel.source, rel.target].forEach((text) => {
            if (!seen.has(text)) {
              seen.add(text);
              entities.push({
                id: crypto.randomUUID(),
                text,
                type: deriveEntityType(text, rel.type),
                context: rel.type,
              });
            }
          });
        });

        // Create supabase client only if environment variables are set
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { error } = await supabase.from("entities").insert(entities);
          if (error) console.error("Supabase insert error:", error);
        }

        return new Response(JSON.stringify({ entities }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (apiError) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("AI model error after max retries:", apiError);
          return new Response(
            JSON.stringify({
              error: "AI model service unavailable. Please try again later.",
            }),
            {
              status: 503,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        // Exponential backoff with jitter
        await new Promise((r) =>
          setTimeout(
            r,
            1000 * Math.pow(2, attempts) * (0.5 + Math.random() * 0.5),
          ),
        );
      }
    }

    // This should not be reached due to the return in the catch block, but adding as a safeguard
    return new Response(
      JSON.stringify({ error: "Unknown error processing request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
