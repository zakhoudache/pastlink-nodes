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

interface Event {
  date: string | null;
  description: string;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface GeminiResponse {
  events: Event[];
  people: string[];
  locations: string[];
  terms: string[];
  relationships: Relationship[];
}

/**
 * Extracts a JSON substring from a given text response.
 */
function extractJSON(responseText: string): string {
  const trimmed = responseText.trim();
  if (trimmed.startsWith('{')) return trimmed;
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : trimmed;
}

/**
 * Removes trailing commas before closing brackets/braces.
 */
function cleanJSON(jsonText: string): string {
  return jsonText.replace(/,\s*([\]}])/g, '$1');
}

/**
 * Validates and sanitizes the parsed Gemini response.
 */
function sanitizeResponse(json: Partial<GeminiResponse>): GeminiResponse {
  const defaultResponse: GeminiResponse = {
    events: [],
    people: [],
    locations: [],
    terms: [],
    relationships: []
  };

  const sanitized: GeminiResponse = {
    ...defaultResponse,
    ...json,
    events: Array.isArray(json.events) ? json.events : [],
    people: Array.isArray(json.people) ? json.people : [],
    locations: Array.isArray(json.locations) ? json.locations : [],
    terms: Array.isArray(json.terms) ? json.terms : [],
    relationships: Array.isArray(json.relationships) ? json.relationships : []
  };

  // Sanitize events: ensure description exists and date is either valid or null.
  sanitized.events = sanitized.events
    .filter(event => event && typeof event.description === 'string')
    .map(event => ({
      ...event,
      date: (typeof event.date === 'string' && event.date.trim() !== '') ? event.date : null,
    }));

  // Sanitize relationships: ensure required fields exist and default type if needed.
  sanitized.relationships = sanitized.relationships
    .filter(rel =>
      rel?.source && rel?.target && rel?.type &&
      typeof rel.source === 'string' &&
      typeof rel.target === 'string' &&
      typeof rel.type === 'string'
    )
    .map(rel => ({
      ...rel,
      type: VALID_RELATIONSHIP_TYPES.includes(rel.type.toLowerCase().replace(/ /g, '-'))
        ? rel.type.toLowerCase().replace(/ /g, '-')
        : 'related-to',
    }));

  // Add a default relationship if none are present.
  if (sanitized.relationships.length === 0) {
    const defaultSource = sanitized.people[0] || sanitized.locations[0] || "Unknown";
    const defaultTarget = sanitized.terms[0] || "Event";
    sanitized.relationships.push({
      source: defaultSource,
      target: defaultTarget,
      type: "related-to"
    });
  }
  return sanitized;
}

/**
 * Main request handler.
 */
async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body.
    const { text, temperature } = await req.json();
    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "The 'text' field is required and cannot be empty." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retrieve API key from environment.
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    // Initialize the Google Generative AI model.
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

    // Construct the prompt with clear instructions.
    const prompt = `
You are an expert data extraction specialist. Your ONLY task is to analyze the following historical text and return the key information as a **VALID JSON object**.

**CRITICAL: You MUST respond with valid JSON. NO EXCEPTIONS! Do NOT add ANY text before, after, or outside the JSON object. The JSON MUST be parsable.**

The JSON object MUST have the following EXACT structure. Pay VERY close attention to commas, brackets, and braces.

\`\`\`json
{
  "events": [
    {
      "date": "Date (YYYY or YYYY-MM)",
      "description": "Concise description"
    }
    // No trailing commas allowed in the list
  ],
  "people": ["List of key people"],
  "locations": ["List of geographical locations"],
  "terms": ["List of key historical terms"],
  "relationships": [
    {
      "source": "Entity 1",
      "target": "Entity 2",
      "type": "Relationship type"
    }
    // No trailing commas allowed in the list
  ]
}
\`\`\`

Example of a correct JSON response:

\`\`\`json
{
  "events": [
    {
      "date": "1914-07",
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

Strict rules you MUST follow:
1. The ENTIRE response MUST be valid JSON.
2. Dates: YYYY or YYYY-MM. If no date, use NULL.
3. Each list must contain at least one element (use "" if nothing found).
4. Extract directly. Do NOT infer.
5. "related-to" is the default relationship.
6. No duplicate entities.
7. Enclose the last element of an array without a trailing comma.

Historical Text: ${text}
`;

    // Generate content using the Gemini model.
    const result = await model.generateContent(prompt);
    let responseText = (await result.response.text()).trim();

    // Extract and clean JSON from the response.
    responseText = extractJSON(responseText);
    let parsedResponse: GeminiResponse;
    try {
      parsedResponse = JSON.parse(responseText) as GeminiResponse;
    } catch (error) {
      console.error("Initial JSON parsing failed:", error);
      responseText = cleanJSON(responseText);
      try {
        parsedResponse = JSON.parse(responseText) as GeminiResponse;
        console.info("JSON parsing succeeded after cleanup.");
      } catch (cleanupError) {
        console.error("JSON parsing failed after cleanup:", cleanupError);
        console.error("Raw response:", responseText);
        return new Response(
          JSON.stringify({
            error: "Failed to parse API response to JSON. Check logs for details.",
            details: (error as Error).message,
            rawResponse: responseText,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate and sanitize the parsed response.
    const sanitizedResponse = sanitizeResponse(parsedResponse);
    return new Response(
      JSON.stringify(sanitizedResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-cache" }
      }
    );

  } catch (error) {
    console.error("Processing error:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred during processing.",
        details: (error as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

Deno.serve(handleRequest);
