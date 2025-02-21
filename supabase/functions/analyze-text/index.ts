
import 'xhr';
import { serve } from 'std/server';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

interface Entity {
  text: string;
  type: string;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface AnalysisResult {
  entities: Entity[];
  relationships: Relationship[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the following historical text and extract:
            1. Entities (events, people, terms, dates, goals, indicators, countries, and PESC factors)
            2. Relationships between these entities

            Format the response as JSON with this structure:
            {
              "entities": [
                { "text": "entity name", "type": "entity type" }
              ],
              "relationships": [
                { "source": "source entity text", "target": "target entity text", "type": "relationship type" }
              ]
            }

            Text to analyze: ${text}`,
          }],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text) as AnalysisResult;

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-text function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
