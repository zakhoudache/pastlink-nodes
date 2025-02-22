
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@^0.3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('Missing Gemini API key')
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Create a structured prompt for historical analysis
    const prompt = `Analyze this historical text and extract the following information. Return ONLY the JSON object without any markdown formatting or explanation:
    {
      "events": [{"date": "YYYY", "description": "event description"}],
      "people": ["person name"],
      "locations": ["location name"],
      "terms": ["key term"],
      "relationships": [{"from": "entity1", "to": "entity2", "type": "relationship type"}]
    }
    
    Text to analyze: ${text}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()
    
    // Extract JSON from the response
    let cleanJson = analysisText
    // Remove any markdown code block formatting if present
    cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Try to parse the cleaned JSON
    try {
      const parsedAnalysis = JSON.parse(cleanJson)
      console.log('Successfully parsed analysis:', parsedAnalysis)
      
      return new Response(
        JSON.stringify({ analysis: JSON.stringify(parsedAnalysis) }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (parseError) {
      console.error('Error parsing analysis JSON:', parseError)
      console.log('Raw analysis text:', analysisText)
      throw new Error('Failed to parse analysis results')
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
