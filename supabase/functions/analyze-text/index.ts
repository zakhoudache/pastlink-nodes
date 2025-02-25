
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.3.0";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      throw new Error('No text provided');
    }

    const apiKey = "AIzaSyA1V7Klm9lyEPtw6PViEeeTPoCTwwJQt5E";
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the following text and extract both entities (people, places, events, concepts) and relationships between them. Format the response as JSON with two arrays: "entities" and "relationships".

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    console.log("Raw AI response:", rawText);

    // Clean up the response text to ensure valid JSON
    const cleanJson = rawText.replace(/```json\n?|```/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (error) {
      console.error("JSON parse error:", error);
      throw new Error("Invalid response format from AI model");
    }

    // Process and validate entities
    const entities = parsed.entities?.map((entity: any) => ({
      id: crypto.randomUUID(),
      text: entity.text,
      type: entity.type.toLowerCase(),
      context: entity.context || "",
      startIndex: 0, // Since we're not tracking position in text
      endIndex: 0,   // Since we're not tracking position in text
    })) || [];

    // Process and validate relationships
    const relationships = parsed.relationships?.map((rel: any) => ({
      source: entities.find(e => e.text === rel.source)?.id || "",
      target: entities.find(e => e.text === rel.target)?.id || "",
      type: rel.type.toLowerCase(),
      description: rel.description || "",
    })).filter((rel: Relationship) => rel.source && rel.target) || [];

    console.log("Processed entities:", entities);
    console.log("Processed relationships:", relationships);

    return new Response(
      JSON.stringify({ entities, relationships }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in analyze-text function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
