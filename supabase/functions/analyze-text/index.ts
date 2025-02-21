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

      Format the relationships part in valid JSON like this example (ensure it's proper JSON format):
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

      First provide the Arabic summary, then on a new line write exactly "RELATIONSHIPS_JSON:" followed by the JSON on the next line.
      Ensure the JSON is properly formatted and valid.
    `;

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is not set');
      return new Response(JSON.stringify({ error: 'Gemini API key missing' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Gemini API request failed',
        details: data.error?.message || 'Unknown error'
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Invalid response format from Gemini API'
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const fullText = data.candidates[0].content.parts[0].text;
    const [summary, relationshipsRaw] = fullText.split('RELATIONSHIPS_JSON:');

    // More robust JSON extraction
    let relationships = [];
    try {
      if (relationshipsRaw) {
        // Clean up the JSON string
        const jsonStr = relationshipsRaw
          .replace(/```json\s*/g, '') // Remove JSON code block markers
          .replace(/```\s*/g, '')     // Remove closing code block markers
          .replace(/^json\s*/i, '')   // Remove "json" prefix
          .trim();

        // Try to find JSON object bounds
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}') + 1;
        
        if (startIdx >= 0 && endIdx > startIdx) {
          const cleanJson = jsonStr.slice(startIdx, endIdx);
          const parsed = JSON.parse(cleanJson);
          
          if (Array.isArray(parsed.relationships)) {
            relationships = parsed.relationships;
          } else {
            throw new Error('Invalid relationships structure');
          }
        } else {
          throw new Error('Could not find valid JSON object bounds');
        }
      }
    } catch (e) {
      console.error('Error parsing relationships JSON:', e);
      console.log('Raw relationships text:', relationshipsRaw);
      return new Response(JSON.stringify({
        error: 'Failed to parse relationships data',
        details: e instanceof Error ? e.message : 'Unknown error',
        summary: summary.trim(), // Still return the summary even if relationships parsing fails
        relationships: [] // Return empty relationships array
      }), {
        status: 200, // Return 200 since we still have useful data
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ 
        summary: summary.trim(), 
        relationships 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});