
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

Return the response in this exact JSON format:
{
  "entities": [
    { "text": "entity text", "type": "type of entity", "relatedTo": ["related entity texts"] }
  ],
  "relationships": [
    { "source": "source entity text", "target": "target entity text", "type": "relationship type" }
  ]
}`;

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
    throw new Error('Failed to analyze text');
  }

  const data = await response.json();
  try {
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return result;
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
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
