
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
      Analyze the following text and extract entities and relationships.
      
      Rules:
      1. Return ONLY valid JSON, no other text
      2. Use this exact format:
      {
        "relationships": [
          {
            "text": "text of the entity",
            "type": "type of the entity"
          }
        ]
      }
      3. Valid types are: event, person, cause, political, economic, social, cultural, term, date, goal, indicator, country
      4. Do not include any explanations or extra text, just the JSON

      Text to analyze:
      ${text}
    `

    console.log('Sending request to Gemini API with prompt:', prompt)

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
      const errorText = await response.text()
      console.error('Gemini API Error:', errorText)
      throw new Error('Failed to analyze text with Gemini API')
    }

    const data = await response.json()
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid API response structure:', JSON.stringify(data))
      throw new Error('Invalid API response structure')
    }

    const responseText = data.candidates[0].content.parts[0].text.trim()
    console.log('Raw Gemini response:', responseText)
    
    try {
      // Attempt to parse the response text as JSON
      const parsedResponse = JSON.parse(responseText)
      
      // Validate the response structure
      if (!parsedResponse || !Array.isArray(parsedResponse.relationships)) {
        console.error('Invalid response format:', responseText)
        throw new Error('Invalid response format: relationships array missing')
      }

      // Clean and validate each relationship
      const validatedRelationships = parsedResponse.relationships.filter(rel => {
        const isValid = rel && 
          typeof rel.text === 'string' && 
          typeof rel.type === 'string' &&
          rel.text.trim() !== '' &&
          ['event', 'person', 'cause', 'political', 'economic', 'social', 
           'cultural', 'term', 'date', 'goal', 'indicator', 'country'].includes(rel.type)
        
        if (!isValid) {
          console.warn('Filtered out invalid relationship:', rel)
        }
        return isValid
      })

      const result = { relationships: validatedRelationships }
      console.log('Final validated response:', JSON.stringify(result, null, 2))

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (error) {
      console.error('Failed to parse or validate response:', error)
      console.error('Response text that failed to parse:', responseText)
      throw new Error(`Failed to parse analysis results: ${error.message}`)
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
