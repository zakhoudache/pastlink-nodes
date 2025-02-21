import { corsHeaders } from '../shared-one/cors';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: 'Failed to parse JSON'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { text } = requestBody;

    // Validate required fields
    if (!text) {
      console.error('Missing required text field');
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'Text field is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for API key
    if (!GEMINI_API_KEY) {
      console.error('Missing Gemini API key');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing API key'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const prompt = `
      Please analyze the following historical text and provide a comprehensive summary in Arabic that:
      1. يحدد الأحداث والشخصيات والمفاهيم الرئيسية
      2. يشرح العلاقات بين العناصر المختلفة
      3. يسلط الضوء على الأسباب والنتائج الرئيسية
      4. يناقش العوامل السياسية والاقتصادية والاجتماعية والثقافية

      After the summary, on a new line write "RELATIONSHIPS_JSON:" followed by a JSON object containing relationships found in the text. The JSON must be a valid object with a "relationships" array.  Do not include any other text or formatting around the JSON object, including markdown.
      Start the JSON object immediately after the colon without any leading text or spaces.

      Text to analyze:
      ${text}
    `;

    // Call Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          stopSequences: []
        },
        safetySettings: [{
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }]
      })
    });

    // Handle Gemini API response
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing Gemini API response:', error);
      return new Response(
        JSON.stringify({
          error: 'API error',
          details: 'Failed to parse Gemini API response'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return new Response(
        JSON.stringify({
          error: 'API error',
          details: 'Error calling Gemini API'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response structure:', data);
      return new Response(
        JSON.stringify({
          error: 'API error',
          details: 'Invalid response structure from Gemini API'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const fullText = data.candidates[0].content.parts[0].text;
    const [summary, relationshipsRaw] = fullText.split('RELATIONSHIPS_JSON:');

    // Process relationships
    let relationships = [];
    if (relationshipsRaw) {
      try {
        // Improved JSON extraction:  Find the *first* '{' and *last* '}'

        let jsonStr = '';
        const startIdx = relationshipsRaw.indexOf('{');
        const endIdx = relationshipsRaw.lastIndexOf('}') + 1;


        if (startIdx !== -1 && endIdx > startIdx) {
            //Extract the JSON substring
            jsonStr = relationshipsRaw.substring(startIdx, endIdx).trim();
        } else {
            console.warn("Could not find valid JSON bounds in relationshipsRaw:", relationshipsRaw);
            throw new Error("Could not find valid JSON bounds.");  // Force error
        }

        // **AGGRESSIVE CLEANUP: Remove anything before the first '{'**
        jsonStr = jsonStr.substring(jsonStr.indexOf('{')).trim();

        // Attempt to parse the JSON string
        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed.relationships)) {
          relationships = parsed.relationships;
        } else {
          console.warn("Parsed JSON does not have a 'relationships' array:", parsed);
          // Optionally, handle cases where Gemini returns a valid JSON, but without the array.
        }


      } catch (error) {
        console.error('Error parsing relationships JSON:', error);
        console.log('Raw relationships text:', relationshipsRaw);
        console.log('Extracted JSON string:', jsonStr); // Log the string *before* parsing
        return new Response( // Return an error response to the client
          JSON.stringify({
            error: 'Failed to parse relationships JSON',
            details: error.message,
            raw_text: relationshipsRaw,  // Include the raw text for debugging
            extracted_json: jsonStr
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate relationships format
    relationships = relationships.filter(rel =>
      rel &&
      typeof rel === 'object' &&
      typeof rel.text === 'string' &&
      typeof rel.type === 'string'
    );

    return new Response(
      JSON.stringify({
        summary: summary.trim(),
        relationships
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
