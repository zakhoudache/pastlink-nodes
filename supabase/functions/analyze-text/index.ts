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
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestBody = await req.json();
    const { text, temperature } = requestBody;

    // Validate the 'text' input
    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: "The 'text' field is required and cannot be empty." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retrieve the Gemini API key from the environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("The GEMINI_API_KEY environment variable is not set.");
    }

    // Initialize the Google Generative AI model
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

    // Construct the prompt for the Gemini model
    const prompt = `Analyze the following historical text and extract entities and relationships in a precise and organized manner.  You must extract key events, people, locations, and terms, as well as the relationships between these entities.  Do not add any additional text or notes outside of the specified JSON structure.

The output should be a JSON object with the following structure:
{
  "events": [
    {
      "date": "Date (preferably in YYYY or YYYY-MM-DD format)",
      "description": "Concise and detailed description of the event"
    }
  ],
  "people": ["List of key people"],
  "locations": ["List of geographical locations"],
  "terms": ["List of fundamental historical concepts and terms"],
  "relationships": [
    {
      "source": "Name of the first entity (person, event, location)",
      "target": "Name of the related entity",
      "type": "Type of relationship (must be one of: ${VALID_RELATIONSHIP_TYPES.join(', ')})"
    }
  ]
}

### Instructions and Conditions:
1. Do not add any text or explanations outside the specified JSON structure.
2. Ensure all dates are consistent in format.
3. Each list must contain at least one element; if information for some categories is not available, leave them empty.
4. Extract entities and relationships directly from the historical text without inferences or additions.
5. If the extracted relationship does not match the specified types, use "related-to" as the default.
6. Descriptions should be accurate, detailed, and concise.
7. Do not repeat entities; if an entity appears more than once, include it only once in the list.

**Text to analyze:** ${text}`;

    // Generate content using the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Attempt to extract JSON if surrounded by formatting markers
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
      console.error("Failed to parse API response to JSON:", error);
      console.error("Received text:", responseText);
      throw new Error(`Failed to parse API response to JSON: ${error.message}`);
    }

    // Validate and sanitize the JSON response
    try {
      // Ensure all expected lists exist
      ['events', 'people', 'locations', 'terms', 'relationships'].forEach(key => {
        if (!Array.isArray(jsonResponse[key])) {
          jsonResponse[key] = [];
        }
      });

      // Sanitize and validate relationships
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
          type: VALID_RELATIONSHIP_TYPES.includes(rel.type.toLowerCase().replace(/ /g, '-'))
            ? rel.type.toLowerCase().replace(/ /g, '-')
            : 'related-to'  // Use default if invalid
        }));

      // Sanitize and validate events
      jsonResponse.events = jsonResponse.events
        .filter((event: any) =>
          event?.date &&
          event?.description &&
          typeof event.date === 'string' &&
          typeof event.description === 'string'
        );

      // Provide a default relationship if none are found
      if (jsonResponse.relationships.length === 0) {
        // Provide more robust handling for cases where the required array is empty.
        // Use a fallback in cases where arrays might be empty
        const source = jsonResponse.people[0] || jsonResponse.locations[0] || "Unknown";
        const target = jsonResponse.terms[0] || "Event";

        jsonResponse.relationships.push({
          source: source,
          target: target,
          type: "related-to"
        });
      }

      // Respond with the processed JSON data
      return new Response(
        JSON.stringify(jsonResponse),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          },
        }
      );
    } catch (error: any) {
      console.error("Error during response validation:", error);
      throw new Error(`Error during response validation: ${error.message}`);
    }

  } catch (error: any) {
    // Handle any errors that occurred during processing
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred during processing.",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});