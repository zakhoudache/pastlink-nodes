import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { label, type, description } = await req.json();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable historian providing focused context about historical entities. Be concise but informative.',
          },
          {
            role: 'user',
            content: `Generate a detailed but concise context about this historical entity:
              Type: ${type}
              Name/Label: ${label}
              Description: ${description || 'No description provided'}
              
              Focus on historical significance, key events, and relationships with other entities.
              Format the response with appropriate markdown headings and bullet points.`
          }
        ],
      }),
    });
    const data = await response.json();
    const generatedContext = data.choices[0].message.content;
    return new Response(
      JSON.stringify({ context: generatedContext }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});