import { corsHeaders } from "../shared-one/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@^0.3.0';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json();
    const { text } = requestBody;

    if (!text || text.trim() === "") {
      return new Response("Error: Missing or empty required field 'text'.", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Initialize Gemini with your API key
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a structured prompt for historical analysis
    const prompt = `Analyze this historical text and extract the following information. Return ONLY the JSON object without any markdown formatting or explanation:
    {
      "events": [{"date": "YYYY", "description": "event description"}],
      "people": ["person name"],
      "locations": ["location name"],
      "terms": ["key term"],
      "relationships": [{"from": "entity1", "to": "entity2", "type": "relationship type"}]
    }
    
    Text to analyze: ${text}`;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    let jsonResponse;
    try {
      // Parse the response directly as JSON
      jsonResponse = JSON.parse(responseText);
    } catch (error: any) {
      console.error("Failed to parse API response as JSON:", error);
      console.error("Response text:", responseText);
      throw new Error(`Failed to parse API response as JSON: ${error.message}`);
    }
    
    try {
      // Validate the response structure
      if (!Array.isArray(jsonResponse.events)) {
        throw new Error("Invalid response format: events array missing");
      }
      if (!Array.isArray(jsonResponse.people)) {
        throw new Error("Invalid response format: people array missing");
      }
      if (!Array.isArray(jsonResponse.locations)) {
        throw new Error("Invalid response format: locations array missing");
      }
      if (!Array.isArray(jsonResponse.terms)) {
        throw new Error("Invalid response format: terms array missing");
      }
      if (!Array.isArray(jsonResponse.relationships)) {
        throw new Error("Invalid response format: relationships array missing");
      }

      // Validate each relationship object
      jsonResponse.relationships = jsonResponse.relationships.filter((rel: any) => 
        rel.from && rel.to && rel.type &&
        typeof rel.from === 'string' &&
        typeof rel.to === 'string' &&
        typeof rel.type === 'string'
      );

      // Validate each event object
      jsonResponse.events = jsonResponse.events.filter((event: any) =>
        event.date && event.description &&
        typeof event.date === 'string' &&
        typeof event.description === 'string'
      );

      return new Response(JSON.stringify(jsonResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error: any) {
      throw new Error(`Error validating response: ${error.message}`);
    }

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: "Processing error",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});