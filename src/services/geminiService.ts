import { useQuery } from '@tanstack/react-query';

interface Entity {
  text: string;
  type: 'event' | 'person' | 'cause' | 'political' | 'economic' | 'social' | 'cultural';
  relatedTo?: string[];
}

interface EntityAnalysisResponse {
  entities: Entity[];
  relationships: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

const SYSTEM_PROMPT = `You are an AI assistant that analyzes historical texts in Arabic.
Your task is to:
1. Identify key entities (events, people, causes, and PESC factors)
2. Classify each entity into one of these types: event, person, cause, political, economic, social, cultural
3. Identify relationships between entities

Return the response in the following format exactly (do not include any extra text):

RESULT_START:
{
  "entities": [
    { "text": "entity text", "type": "type of entity", "relatedTo": ["related entity texts"] }
  ],
  "relationships": [
    { "source": "source entity text", "target": "target entity text", "type": "relationship type" }
  ]
}
RESULT_END:`;

export async function analyzeText(text: string): Promise<EntityAnalysisResponse> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\nText to analyze: ${text}`
        }]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('API error response:', errText);
    throw new Error('Failed to analyze text');
  }

  const data = await response.json();

  // Validate structure
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    console.error('Unexpected API response structure:', data);
    throw new Error('Invalid API response structure');
  }

  const rawOutput = data.candidates[0].content.parts[0].text;

  // Extract JSON between markers RESULT_START: and RESULT_END:
  const regex = /RESULT_START:\s*([\s\S]*?)\s*RESULT_END:/;
  const match = rawOutput.match(regex);
  let jsonStr = '';
  if (match && match[1]) {
    jsonStr = match[1].trim();
  } else {
    console.error('Could not extract JSON using markers. Raw output:', rawOutput);
    throw new Error('Failed to extract JSON from analysis results');
  }

  try {
    const result = JSON.parse(jsonStr);
    return result;
  } catch (error) {
    console.error('Error parsing extracted JSON:', error);
    console.error('Extracted JSON string:', jsonStr);
    throw new Error('Failed to parse analysis results');
  }
}

export function useTextAnalysis(text: string) {
  return useQuery({
    queryKey: ['textAnalysis', text],
    queryFn: () => analyzeText(text),
    enabled: !!text && text.length > 0,
  });
}
