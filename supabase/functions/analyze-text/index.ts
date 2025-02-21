import { corsHeaders } from '../shared-one/cors';

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Advanced JSON parsing utility
function parseLooseJSON(text: string) {
  // Remove any prefix before the first {
  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) return null;
  
  text = text.slice(jsonStart);
  
  // Remove any suffix after the last }
  const jsonEnd = text.lastIndexOf('}');
  if (jsonEnd === -1) return null;
  
  text = text.slice(0, jsonEnd + 1);
  
  try {
    // First try direct parsing
    return JSON.parse(text);
  } catch (e) {
    try {
      // Try fixing common issues
      text = text
        // Fix line breaks inside strings
        .replace(/(?<!\\)\\n/g, '\\n')
        // Fix unescaped quotes inside strings
        .replace(/(?<!\\)"/g, '\\"')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1');
      
      return JSON.parse(text);
    } catch (e2) {
      return null;
    }
  }
}

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

      After the summary, on a new line write "RELATIONSHIPS_JSON:" followed by a JSON object containing relationships found in the text. Each relationship should have a "text" field and a "type" field. Valid types are: event, person, cause, political, economic, social, cultural.

      The JSON must be a valid object with a "relationships" array. Do not include any other text or formatting around the JSON.

      Text to analyze:
      ${text}
    `;

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const fullText = data.candidates[0].content.parts[0].text;
    const [summary, relationshipsRaw] = fullText.split('RELATIONSHIPS_JSON:');

    // Process relationships with enhanced error handling
    let relationships = [];
    if (relationshipsRaw) {
      // Clean up the raw text
      const cleanedText = relationshipsRaw
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^json/m, '')
        .trim();

      console.log('Attempting to parse JSON from:', cleanedText);

      // Try parsing with our robust parser
      const parsedJson = parseLooseJSON(cleanedText);
      
      if (parsedJson && Array.isArray(parsedJson.relationships)) {
        relationships = parsedJson.relationships;
      } else {
        // Fallback: try to find and parse just the relationships array
        const arrayMatch = cleanedText.match(/\[\s*{[\s\S]*}\s*\]/);
        if (arrayMatch) {
          try {
            const arrayJson = `{"relationships":${arrayMatch[0]}}`;
            const parsed = JSON.parse(arrayJson);
            relationships = parsed.relationships;
          } catch (e) {
            console.error('Fallback parsing failed:', e);
            relationships = [];
          }
        }
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
        relationships,
        parsed: relationships.length > 0
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  }
});