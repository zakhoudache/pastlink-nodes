import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.3.0";
import { delay } from "https://deno.land/std@0.168.0/async/delay.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Entity {
  id: string;
  type: string;
  text: string;
  startIndex: number;
  endIndex: number;
  context?: string;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
  description?: string;
}

// Maximum input length (adjust as needed)
const MAX_INPUT_LENGTH = 10000;

async function analyzeTextWithRetry(text: string, genAI: GoogleGenerativeAI, maxRetries = 3, backoffDelay = 1000) {
    const modelName = Deno.env.get("GOOGLE_GENAI_MODEL_NAME") || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an expert in analyzing text and extracting entities and relationships.
Analyze the following text and extract both entities (people, places, events, concepts) and relationships between them.  Format the response as valid JSON.  Do *NOT* include any text outside of the JSON object.

The JSON should have two arrays: "entities" and "relationships".

For entities, include:
- text (the entity name)
- type (person, place, event, or concept)
- context (brief description or context)

For relationships, include:
- source (entity text)
- target (entity text)
- type (causes, influences, participates, or located)
- description (brief description of the relationship)

Text to analyze: ${text}`;

    let attempts = 0;

    while (attempts < maxRetries) {
        attempts++;
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            console.log("Raw AI response:", rawText);
            let parsed;
            try {
              parsed = JSON.parse(rawText);
            } catch (error) {
              console.error("JSON parse error:", error);
              throw new Error("Invalid response format from AI model");
            }
            return parsed; // Success
        } catch (error: any) {
            if (error?.message?.includes('503 Service Unavailable')) {
                console.warn(`Attempt ${attempts} failed with 503. Retrying in ${backoffDelay}ms...`);
                await delay(backoffDelay);
                backoffDelay *= 2; // Exponential backoff
            } else {
                console.error("Non-retryable error during text analysis:", error);
                throw error; // Re-throw non-retryable errors
            }
        }
    }

    throw new Error(`Failed to analyze text after ${maxRetries} retries: Service Unavailable.`);
}


serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            throw new Error('No text provided');
        }

        if (text.length > MAX_INPUT_LENGTH) {
            throw new Error(`Input text exceeds maximum length of ${MAX_INPUT_LENGTH} characters.`);
        }

        // Sanitize input (example, adjust based on expected content)
        const sanitizedText = text.replace(/</g, "<").replace(/>/g, ">"); // Prevent basic HTML injection

        const apiKey = "AIzaSyADyF440_9myFUo5yBobAg_lEgjT5zIIUI";
        if (!apiKey) {
            throw new Error('API key not configured (environment variable GOOGLE_GENAI_API_KEY)');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const parsedResponse = await analyzeTextWithRetry(sanitizedText, genAI);


      // Process and validate entities
      const entities = parsedResponse.entities?.map((entity: any) => ({
        id: crypto.randomUUID(),
        text: entity.text,
        type: entity.type.toLowerCase(),
        context: entity.context || "",
        startIndex: 0, // Since we're not tracking position in text
        endIndex: 0,   // Since we're not tracking position in text
      })) || [];

      // Create a lookup map for entities by text for faster relationship processing
      const entityMap: { [key: string]: Entity } = {};
      entities.forEach(entity => {
          entityMap[entity.text] = entity;
      });

      // Process and validate relationships
      const relationships = parsedResponse.relationships?.map((rel: any) => {
          const sourceEntity = entityMap[rel.source];
          const targetEntity = entityMap[rel.target];

          return {
              source: sourceEntity?.id || "",
              target: targetEntity?.id || "",
              type: rel.type.toLowerCase(),
              description: rel.description || "",
          };
      }).filter((rel: Relationship) => rel.source && rel.target) || [];

      console.log("Processed entities:", entities);
      console.log("Processed relationships:", relationships);

        return new Response(
            JSON.stringify({ entities, relationships }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );

    } catch (error) {
        console.error("Error in analyze-text function:", error); // Log the entire error object
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
