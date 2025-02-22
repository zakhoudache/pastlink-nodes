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

interface GeminiResponse {
  events: { date: string | null; description: string }[];
  people: string[];
  locations: string[];
  terms: string[];
  relationships: { source: string; target: string; type: string }[];
}


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
    const prompt = `You are a highly skilled data extraction expert. Your task is to analyze the following historical text and extract key information, structuring it as a JSON object.

    **Important: You MUST respond ONLY with valid JSON. Do NOT include any introductory text, explanations, or any other text outside of the JSON object.**

    The JSON object should have the following structure:

    \`\`\`json
    {
      "events": [
        {
          "date": "Date (YYYY or YYYY-MM-DD)",
          "description": "Concise description of the event"
        },
        ...
      ],
      "people": ["List of key people"],
      "locations": ["List of geographical locations"],
      "terms": ["List of key historical concepts and terms"],
      "relationships": [
        {
          "source": "Name of the first entity",
          "target": "Name of the related entity",
          "type": "Type of relationship (one of: ${VALID_RELATIONSHIP_TYPES.join(', ')})"
        },
        ...
      ]
    }
    \`\`\`

    Here's an example of a valid JSON response:

    \`\`\`json
    {
      "events": [
        {
          "date": "1914-07-28",
          "description": "World War I begins"
        }
      ],
      "people": ["Archduke Franz Ferdinand"],
      "locations": ["Sarajevo"],
      "terms": ["Militarism"],
      "relationships": [
        {
          "source": "World War I",
          "target": "Archduke Franz Ferdinand",
          "type": "caused-by"
        }
      ]
    }
    \`\`\`

    Follow these rules strictly:

    1.  **The ENTIRE response MUST be a valid JSON object.**  No exceptions.
    2.  Dates must be in YYYY or YYYY-MM-DD format. If the date isn't found return NULL for the date
    3.  Each list should contain at least one element (can be an empty string "" if nothing's found).
    4.  Extract information directly from the text. Do not make inferences.
    5.  Use 'related-to' as the default relationship type if none other applies.
    6.  Do not include duplicate entities.
        7. If the date isn't found return NULL for the date
    

    Historical Text: ${text}
    `;

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

    let jsonResponse: GeminiResponse;
    try {
      jsonResponse = JSON.parse(responseText) as GeminiResponse;
    } catch (error: any) {
      console.error("Failed to parse API response to JSON:", error);
      console.error("Received text:", responseText);
      return new Response(
        JSON.stringify({
          error: "Failed to parse API response to JSON. Please check the logs.",
          details: error.message,
          rawResponse: responseText,  // Include raw response for debugging
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate and sanitize the JSON response
    try {
      // Ensure all expected lists exist and are arrays
      const defaultResponse: GeminiResponse = {
        events: [],
        people: [],
        locations: [],
        terms: [],
        relationships: [],
      };

      jsonResponse = {
        ...defaultResponse, // Apply defaults
        ...jsonResponse,
        events: Array.isArray(jsonResponse.events) ? jsonResponse.events : [],
        people: Array.isArray(jsonResponse.people) ? jsonResponse.people : [],
        locations: Array.isArray(jsonResponse.locations) ? jsonResponse.locations : [],
        terms: Array.isArray(jsonResponse.terms) ? jsonResponse.terms : [],
        relationships: Array.isArray(jsonResponse.relationships) ? jsonResponse.relationships : [],
      };


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
          event?.description &&
          typeof event.description === 'string'
        )
        .map(event => ({
          ...event,
          date: (typeof event.date === 'string' && event.date.trim() !== '') ? event.date : null, // Handle null dates
        }));


      // Provide a default relationship if none are found
      if (jsonResponse.relationships.length === 0) {
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
      return new Response(
        JSON.stringify({
          error: "Error during response validation. Please check the logs.",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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