
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent"

    const prompt = `
      Analyze the following Arabic text and extract:
      1. Important entities (events, people, concepts, places)
      2. Relationships between these entities
      3. Entity types (event, person, cause, political, economic, social, cultural, term, date, goal, indicator, country)

      Return ONLY a JSON object with the following structure (no other text):
      {
        "relationships": [
          {
            "text": "entity name in Arabic",
            "type": "entity type from the list above"
          }
        ]
      }

      Text to analyze:
      ${text}
    `

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      }),
    })

    if (!response.ok) {
      console.error('Gemini API Error:', await response.text())
      throw new Error('Failed to analyze text with Gemini API')
    }

    const data = await response.json()
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response structure')
    }

    const responseText = data.candidates[0].content.parts[0].text.trim()
    
    try {
      // Parse the response as JSON and validate its structure
      const parsedResponse = JSON.parse(responseText)
      
      if (!Array.isArray(parsedResponse.relationships)) {
        throw new Error('Invalid response format: relationships array missing')
      }

      // Validate each relationship object
      parsedResponse.relationships = parsedResponse.relationships.filter(rel => 
        rel.text && rel.type &&
        typeof rel.text === 'string' &&
        typeof rel.type === 'string'
      )

      console.log('Successfully analyzed text:', JSON.stringify(parsedResponse, null, 2))

      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (error) {
      console.error('Failed to parse Gemini response:', error)
      throw new Error('Failed to parse analysis results')
    }

  } catch (error) {
    console.error('Error in analyze-text function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during text analysis'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
