// supabase/functions/analyze-text/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// IMPORTANT: Replace '*' with your actual frontend origin in production!
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For development. Use a specific origin in production.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Explicitly list allowed methods
};

serve(async (req) => {
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { text } = await req.json();

      const prompt = `
        Please analyze the following historical text and provide a comprehensive summary in Arabic that:
        1. يحدد الأحداث والشخصيات والمفاهيم الرئيسية
        2. يشرح العلاقات بين العناصر المختلفة
        3. يسلط الضوء على الأسباب والنتائج الرئيسية
        4. يناقش العوامل السياسية والاقتصادية والاجتماعية والثقافية

        Also, identify key relationships between elements in the text and classify them as one of these types:
        - event
        - person
        - cause
        - political
        - economic
        - social
        - cultural

        Format the relationships part in JSON like this:
        {
          "relationships": [
            {
              "text": "text of the element",
              "type": "one of the types above"
            }
          ]
        }

        Text to analyze:
        ${text}

        First provide the Arabic summary, then on a new line start with "RELATIONSHIPS_JSON:" followed by the JSON.
      `;

      if (!GEMINI_API_KEY) {
        console.error('Gemini API key is not set');
        return new Response(
          JSON.stringify({ error: 'Gemini API key missing' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Fetch response from Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      const data = await response.json();
      console.log('Full Gemini API response:', data);

      // Check for Gemini API errors
      if (
        !data.candidates ||
        data.candidates.length === 0 ||
        !data.candidates[0].content
      ) {
        console.error('Gemini API error:', data);
        return new Response(
          JSON.stringify({
            error: 'Gemini API returned an unexpected response.',
          }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const fullText = data.candidates[0].content.parts[0].text;
      const [summary, relationshipsJson] = fullText.split('RELATIONSHIPS_JSON:');
      let relationships = [];

      try {
        if (relationshipsJson) {
          // Use a regular expression to extract the JSON
          const jsonMatch = relationshipsJson.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            relationships = JSON.parse(jsonMatch[1].trim()).relationships;
          } else {
            console.error('Error: Could not find JSON in Gemini response.');
            return new Response(
              JSON.stringify({
                error:
                  'Could not find relationships JSON in the expected format.',
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      } catch (e) {
        console.error('Error parsing relationships JSON:', e);
        return new Response(
          JSON.stringify({
            error: 'Error parsing Gemini response JSON',
            details: e.message,
            geminiResponse: fullText,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ summary: summary.trim(), relationships }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error generating summary:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle unsupported methods
  return new Response('Method Not Allowed', {
    status: 405,
    headers: corsHeaders,
  });
});
