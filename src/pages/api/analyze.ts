import type { NextApiRequest, NextApiResponse } from 'next';

// **IMPORTANT:** Replace with the actual Gemini API library and key setup

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

async function analyzeText(text: string): Promise<EntityAnalysisResponse> {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
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
        const errorText = await response.text();
        console.error(`Gemini API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to analyze text: ${response.status} - ${errorText}`);
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<EntityAnalysisResponse | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const analysisResult = await analyzeText(text);
        res.status(200).json(analysisResult);
    } catch (error: any) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}