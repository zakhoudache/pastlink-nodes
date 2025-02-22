
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
    const { text, temperature = 0.7 } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('Missing Gemini API key')
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Analyze this historical text and identify relationships between entities. Return ONLY a JSON object with this exact format:
    {
      "relationships": [
        {
          "source": "entity name",
          "target": "other entity name",
          "type": "type of relationship"
        }
      ]
    }
    
    Text to analyze: ${text}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()
    
    // Clean and parse the JSON response
    let cleanJson = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    try {
      const parsedAnalysis = JSON.parse(cleanJson)
      console.log('Successfully parsed analysis:', parsedAnalysis)
      
      if (!Array.isArray(parsedAnalysis.relationships)) {
        throw new Error('Invalid response format: relationships must be an array')
      }

      return new Response(
        JSON.stringify(parsedAnalysis),
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
