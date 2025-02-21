// supabase/functions/analyze-text/index.ts
import { corsHeaders } from '../shared-one/cors';

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

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
      return new Response(JSON.stringify({ error: 'Gemini API key missing' }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();
    console.log('Full Gemini API response:', JSON.stringify(data, null, 2));

    if (
      !data.candidates ||
      data.candidates.length === 0 ||
      !data.candidates[0].content
    ) {
      console.error('Gemini API error:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ error: 'Gemini API returned an unexpected response.' }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fullText = data.candidates[0].content.parts[0].text;
    const [summary, relationshipsJson] = fullText.split('RELATIONSHIPS_JSON:');
    let relationships = [];

    try {
      if (relationshipsJson) {
        const cleanedJson = relationshipsJson
          .replace(/`/g, '')
          .replace(/^json\s*/i, '')
          .trim();

        console.log('Cleaned JSON:', cleanedJson);

        relationships = JSON.parse(cleanedJson).relationships;
      }
    } catch (e: any) {
      console.error('Error parsing relationships JSON:', e);
      return new Response(JSON.stringify({
        error: 'Error parsing Gemini response JSON',
        details: (e as Error).message,
        geminiResponse: fullText,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ summary: summary.trim(), relationships }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
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
      headers: { "Content-Type": "application/json" },
    });
  }
});
