import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    // The prompt now instructs the API to output a plain text summary in Arabic,
    // followed by a list of relationships in plain text.
    const prompt = `
Please analyze the following historical text and provide a comprehensive summary in Arabic.
The summary should identify key events, characters, and concepts, explain the relationships between elements,
and highlight major causes and effects including political, economic, social, and cultural factors.

After the summary, on a new line, output a relationships section using the following format:

RELATIONSHIPS:
- [source entity] -> [target entity] | [relationship type]

Do not use any JSON formatting in your output; only use plain text.

Text to analyze:
${text}
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Gemini API response:", data);
    const fullText = data.candidates[0].content.parts[0].text;

    // We assume the response starts with the Arabic summary,
    // then later contains the marker "RELATIONSHIPS:" followed by relationship details.
    const marker = "RELATIONSHIPS:";
    const markerIndex = fullText.indexOf(marker);
    let summary: string, relationships: string;
    if (markerIndex !== -1) {
      summary = fullText.substring(0, markerIndex).trim();
      relationships = fullText.substring(markerIndex).trim();
    } else {
      summary = fullText.trim();
      relationships = "No relationships information provided.";
    }

    // Combine the summary and relationships into one plain text output.
    const output = `SUMMARY (Arabic):\n${summary}\n\n${relationships}`;
    return new Response(output, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
