import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@^0.3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { label, type, description } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a detailed but concise historical context about this entity:
      Type: ${type}
      Name/Label: ${label}
      Description: ${description || 'No description provided'}
      
      Focus on historical significance, key events, and relationships with other entities.
      Format the response with appropriate markdown headings and bullet points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedContext = response.text();

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
