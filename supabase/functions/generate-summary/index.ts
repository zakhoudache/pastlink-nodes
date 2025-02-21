
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      
      First provide the Arabic summary, then on a new line start with "RELATIONSHIPS_JSON:" .
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    console.log('Gemini API response:', data);
    const fullText = data.candidates[0].content.parts[0].text;
    
    // Split the response into summary and relationships
    const [summary, relationshipsJson] = fullText.split('RELATIONSHIPS_JSON:');
    let relationships = [];
    try {
      if (relationshipsJson) {
        relationships = JSON.parse(relationshipsJson.trim()).relationships;
      }
    } catch (e) {
      console.error('Error parsing relationships JSON:', e);
    }

    return new Response(JSON.stringify({ summary: summary.trim(), relationships }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
