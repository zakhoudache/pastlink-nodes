// index.ts

import { corsHeaders } from '../shared-one/cors';
import { ALTERNATIVE_PROMPT } from './utils';

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
    // Parse incoming request body
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

    // Build the prompt using our alternative prompt from utils.ts.
    const prompt = `${ALTERNATIVE_PROMPT}\n\nText to analyze:\n${text}`;

    // Call the Gemini API
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

    // Extract the custom formatted output between RESULT_START: and RESULT_END:
    const startMarker = "RESULT_START:";
    const endMarker = "RESULT_END:";
    const startIndex = fullText.indexOf(startMarker);
    const endIndex = fullText.lastIndexOf(endMarker);
    if (startIndex === -1 || endIndex === -1) {
      console.error("Could not find valid markers in output:", fullText);
      return new Response(
        JSON.stringify({
          error: "Extraction error",
          details: "Markers not found in API response",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const extracted = fullText
      .substring(startIndex + startMarker.length, endIndex)
      .trim();

    // The expected custom format is:
    //
    // ENTITIES:
    // - [entity text] | [entity type] | related: [related entity text1]; [related entity text2]
    // - [another entity] | [another type] | related:
    // RELATIONSHIPS:
    // - [source entity] -> [target entity] | [relationship type]
    // - [another source] -> [another target] | [relationship type]

    // Split the extracted output into lines and trim them
    const lines = extracted
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const entitiesIndex = lines.findIndex((line) =>
      line.toUpperCase().startsWith("ENTITIES:")
    );
    const relationshipsIndex = lines.findIndex((line) =>
      line.toUpperCase().startsWith("RELATIONSHIPS:")
    );

    if (entitiesIndex === -1 || relationshipsIndex === -1) {
      console.error(
        "Could not find ENTITIES or RELATIONSHIPS markers in output:",
        extracted
      );
      return new Response(
        JSON.stringify({
          error: "Extraction error",
          details: "Required section markers not found in output",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract entity lines (lines between ENTITIES: and RELATIONSHIPS:)
    const entityLines = lines.slice(entitiesIndex + 1, relationshipsIndex);
    // Extract relationship lines (lines after RELATIONSHIPS:)
    const relationshipLines = lines.slice(relationshipsIndex + 1);

    // Parse entity lines.
    const entities = entityLines.map((line) => {
      // Remove any leading hyphen
      if (line.startsWith("-")) {
        line = line.substring(1).trim();
      }
      // Expected format: "[entity text] | [entity type] | related: [related entity text1]; [related entity text2]"
      const parts = line.split("|").map((s) => s.trim());
      const entityText = parts[0] || "";
      const entityType = parts[1] || "";
      let relatedTo: string[] = [];
      if (parts.length > 2 && parts[2].toLowerCase().startsWith("related:")) {
        const relatedStr = parts[2].substring("related:".length).trim();
        relatedTo = relatedStr.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
      }
      return { text: entityText, type: entityType, relatedTo };
    });

    // Parse relationship lines.
    const relationships = relationshipLines
      .map((line) => {
        if (line.startsWith("-")) {
          line = line.substring(1).trim();
        }
        // Expected format: "[source entity] -> [target entity] | [relationship type]"
        const arrowIndex = line.indexOf("->");
        if (arrowIndex === -1) return null;
        const source = line.substring(0, arrowIndex).trim();
        const remainder = line.substring(arrowIndex + 2).trim();
        const pipeIndex = remainder.indexOf("|");
        let target = "";
        let relType = "";
        if (pipeIndex !== -1) {
          target = remainder.substring(0, pipeIndex).trim();
          relType = remainder.substring(pipeIndex + 1).trim();
        } else {
          target = remainder;
        }
        return { source, target, type: relType };
      })
      .filter((r) => r !== null);

    return new Response(
      JSON.stringify({ entities, relationships }),
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
