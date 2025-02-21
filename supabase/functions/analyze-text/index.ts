// index.ts

import { corsHeaders } from '../shared-one/cors';
import { createClient } from '@supabase/supabase-js';
import { SUMMARY_RELATIONSHIPS_PROMPT } from './utils';

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Failed to parse JSON",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { text } = requestBody;
    if (!text) {
      console.error("Missing required text field");
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "Text field is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error("Missing Gemini API key");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Missing API key",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build prompt using the robust prompt from utils.ts
    const prompt = `${SUMMARY_RELATIONSHIPS_PROMPT}\n\nText to analyze:\n${text}`;

    // Call Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Error parsing Gemini API response:", error);
      return new Response(
        JSON.stringify({
          error: "API error",
          details: "Failed to parse Gemini API response",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return new Response(
        JSON.stringify({
          error: "API error",
          details: "Error calling Gemini API",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Invalid Gemini API response structure:", data);
      return new Response(
        JSON.stringify({
          error: "API error",
          details: "Invalid response structure from Gemini API",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fullText = data.candidates[0].content.parts[0].text;

    // ----- NEW EXTRACTION APPROACH -----
    // Instead of relying on markers, extract the JSON using the first '{' and last '}'.
    const firstBrace = fullText.indexOf("{");
    const lastBrace = fullText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error("Could not find valid JSON boundaries in output:", fullText);
      return new Response(
        JSON.stringify({
          error: "Extraction error",
          details: "No valid JSON object found in the API response.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const jsonStr = fullText.substring(firstBrace, lastBrace + 1).trim();
    // ------------------------------------

    // Try to parse the JSON string
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error parsing extracted JSON:", error);
      console.error("Extracted JSON string:", jsonStr);
      return new Response(
        JSON.stringify({
          error: "Failed to parse analysis results",
          details: error instanceof Error ? error.message : "Unknown error",
          raw_text: jsonStr,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For the summary extraction, attempt to use markers (if present)
    let summary = "";
    const summaryRegex = /SUMMARY_START:\s*([\s\S]*?)\s*SUMMARY_END:/;
    const summaryMatch = fullText.match(summaryRegex);
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    } else {
      // If markers aren't found, fallback to an empty summary or use a default message.
      summary = "";
    }

    // Expecting the JSON to contain "relationships" property
    let relationships = [];
    if (parsedResult.relationships && Array.isArray(parsedResult.relationships)) {
      relationships = parsedResult.relationships;
    } else {
      console.warn("Parsed JSON does not have a 'relationships' array", parsedResult);
    }

    return new Response(
      JSON.stringify({
        summary,
        relationships,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
