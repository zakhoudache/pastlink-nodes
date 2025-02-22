import { corsHeaders } from "../shared-one/cors.ts";
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@^0.3.0';

const VALID_RELATIONSHIP_TYPES = [
  'caused-by',
  'led-to',
  'influenced',
  'part-of',
  'opposed-to',
  'related-to'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { text, temperature } = requestBody;

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing or empty required field 'text'."
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }
   
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      }
    });

    const prompt = `Analyze this historical text and extract relationships and entities. Return ONLY a valid JSON object matching this structure, with no additional text or formatting:
    {
      "events": [
        {
          "date": "YYYY or specific date",
          "description": "detailed event description"
        }
      ],
      "people": ["list of important people mentioned"],
      "locations": ["list of locations mentioned"],
      "terms": ["list of key historical terms or concepts"],
      "relationships": [
        {
          "source": "entity name (person, event, location)",
          "target": "related entity name",
          "type": "relationship type"
        }
      ]
    }

    Requirements:
    1. For relationships, use ONLY these types: caused-by, led-to, influenced, part-of, opposed-to, related-to
    2. Source and target must be actual entities mentioned in the text
    3. Each array must contain at least one item
    4. Dates should be consistent in format
    5. Descriptions should be detailed but concise

    Text to analyze: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Try to extract JSON if it's wrapped in backticks or other formatting
    if (!responseText.startsWith('{')) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (error: any) {
      console.error("Failed to parse API response as JSON:", error);
      console.error("Response text:", responseText);
      throw new Error(`Failed to parse API response as JSON: ${error.message}`);
    }
   
    try {
      // Validate arrays exist
      ['events', 'people', 'locations', 'terms', 'relationships'].forEach(key => {
        if (!Array.isArray(jsonResponse[key])) {
          jsonResponse[key] = [];
        }
      });

      // Clean and validate relationships
      jsonResponse.relationships = jsonResponse.relationships
        .filter((rel: any) => 
          rel?.source && 
          rel?.target && 
          rel?.type &&
          typeof rel.source === 'string' &&
          typeof rel.target === 'string' &&
          typeof rel.type === 'string'
        )
        .map((rel: any) => ({
          ...rel,
          // Convert relationship type to valid type or default to 'related-to'
          type: VALID_RELATIONSHIP_TYPES.includes(rel.type.toLowerCase().replace(/ /g, '-')) 
            ? rel.type.toLowerCase().replace(/ /g, '-')
            : 'related-to'
        }));

      // Clean and validate events
      jsonResponse.events = jsonResponse.events
        .filter((event: any) =>
          event?.date &&
          event?.description &&
          typeof event.date === 'string' &&
          typeof event.description === 'string'
        );

      // Ensure arrays are not empty
      if (jsonResponse.relationships.length === 0) {
        jsonResponse.relationships.push({
          source: jsonResponse.people[0] || jsonResponse.locations[0] || "Unknown",
          target: jsonResponse.terms[0] || "Event",
          type: "related-to"
        });
      }

      return new Response(
        JSON.stringify(jsonResponse), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache" 
          },
        }
      );

    } catch (error: any) {
      throw new Error(`Error validating response: ${error.message}`);
    }

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Processing error",
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});