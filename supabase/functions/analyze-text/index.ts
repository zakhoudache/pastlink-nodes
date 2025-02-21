import { corsHeaders } from "../shared-one/cors";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" },
    });
  }

  try {
    const requestBody = await req.json();
    const { text } = requestBody;

    if (!text) {
      return new Response("Error: Missing required field 'text'.", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response("Error: Server configuration error. Missing API key.", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Simplified prompt that requests exact JSON structure
    const prompt = `
Analyze the following Arabic text and extract relationships between entities. 
Return ONLY a JSON object with the following structure, no other text:
{
  "relationships": [
    {
      "source": "entity1",
      "target": "entity2",
      "type": "relationship type"
    }
  ]
}

Text to analyze:
${text}
`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid API response structure");
    }

    const responseText = data.candidates[0].content.parts[0].text.trim();
    
    try {
      // Parse the response directly as JSON
      const jsonResponse = JSON.parse(responseText);
      
      // Validate the response structure
      if (!Array.isArray(jsonResponse.relationships)) {
        throw new Error("Invalid response format: relationships array missing");
      }

      // Validate each relationship object
      jsonResponse.relationships = jsonResponse.relationships.filter(rel => 
        rel.source && rel.target && rel.type &&
        typeof rel.source === 'string' &&
        typeof rel.target === 'string' &&
        typeof rel.type === 'string'
      );

      return new Response(JSON.stringify(jsonResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      throw new Error(`Failed to parse API response as JSON: ${error.message}`);
    }

  } catch (error) {
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