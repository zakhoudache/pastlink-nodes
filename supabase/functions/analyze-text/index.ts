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

      Format the relationships part exactly like this (keep the exact format):
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

      First provide the Arabic summary, then on a new line write exactly "RELATIONSHIPS_JSON:" followed by ONLY the JSON object on the next line with no additional text or formatting.
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

    // Enhanced JSON extraction and parsing
    let relationships = [];
    try {
      if (relationshipsRaw) {
        // More aggressive cleaning of the JSON string
        let jsonStr = relationshipsRaw
          .replace(/```json\s*/g, '')    // Remove JSON code block markers
          .replace(/```\s*/g, '')        // Remove closing code block markers
          .replace(/^[\s\n]*json[\s\n]*/i, '')  // Remove "json" prefix and surrounding whitespace
          .replace(/^\s*\n+\s*/, '')     // Remove leading newlines and whitespace
          .trim();

        // Find the actual JSON object
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}') + 1;
        
        if (startIdx >= 0 && endIdx > startIdx) {
          const cleanJson = jsonStr.slice(startIdx, endIdx);
          
          // Log the cleaned JSON for debugging
          console.log('Attempting to parse JSON:', cleanJson);
          
          const parsed = JSON.parse(cleanJson);
          
          if (Array.isArray(parsed.relationships)) {
            relationships = parsed.relationships;
          } else {
            throw new Error('Invalid relationships structure - expected array');
          }
        } else {
          throw new Error('Could not find valid JSON object bounds');
        }
      }
    } catch (e) {
      console.error('Error parsing relationships JSON:', e);
      console.log('Raw relationships text:', relationshipsRaw);
      
      // Attempt to extract just the relationships array if present
      try {
        const arrayMatch = relationshipsRaw.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          const arrayJson = `{"relationships":${arrayMatch[0]}}`;
          const parsed = JSON.parse(arrayJson);
          relationships = parsed.relationships;
        }
      } catch (e2) {
        console.error('Secondary parsing attempt failed:', e2);
        // Continue with empty relationships array
      }

      // Return partial success with the summary
      return new Response(JSON.stringify({
        summary: summary.trim(),
        relationships,
        warning: 'Relationships parsing may be incomplete'
      }), {
        status: 200,
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