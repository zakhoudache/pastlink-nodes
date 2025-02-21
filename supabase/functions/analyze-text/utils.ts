// utils.ts

/**
 * ENTITY_ANALYSIS_PROMPT:
 * This prompt instructs the AI to analyze historical Arabic texts to extract key entities
 * and relationships. The output must be exactly the JSON object delimited by the markers
 * RESULT_START: and RESULT_END: with no extra text.
 */
export const ENTITY_ANALYSIS_PROMPT = `
You are an AI assistant that analyzes historical texts written in Arabic.
Your task is to:
1. Identify key entities (events, people, causes, and factors in political, economic, social, and cultural domains).
2. Classify each entity into one of the following types: event, person, cause, political, economic, social, cultural.
3. Identify relationships between these entities.

Return your output strictly in the exact JSON format below. Do not include any additional text, commentary, markdown, or code block delimiters.
Your output must begin on a new line with the marker RESULT_START: and end on a new line with the marker RESULT_END:.

RESULT_START:
{
  "entities": [
    { "text": "entity text", "type": "entity type", "relatedTo": ["related entity text"] }
  ],
  "relationships": [
    { "source": "source entity text", "target": "target entity text", "type": "relationship type" }
  ]
}
RESULT_END:
`;

/**
 * SUMMARY_RELATIONSHIPS_PROMPT:
 * This prompt instructs the AI to provide a comprehensive summary (in Arabic) and to extract a relationships JSON.
 * The summary must be delimited by SUMMARY_START: and SUMMARY_END:, and the JSON output must be delimited by
 * RELATIONSHIPS_JSON_START: and RELATIONSHIPS_JSON_END: with no extra text.
 */
export const SUMMARY_RELATIONSHIPS_PROMPT = `
You are an AI assistant that analyzes historical texts in Arabic.
Your tasks are:
1. Provide a comprehensive summary (in Arabic) of the key events, personalities, and concepts in the text.
2. Identify relationships between these elements, including the relationship type (e.g., cause, event, etc.).

Your output must strictly adhere to the following format without any extra commentary, markdown, or formatting:

SUMMARY_START:
[Your summary in Arabic here]
SUMMARY_END:
RELATIONSHIPS_JSON_START:
{
  "relationships": [
    { "source": "source entity text", "target": "target entity text", "type": "relationship type" }
  ]
}
RELATIONSHIPS_JSON_END:

Do not include any additional text or markers other than those specified above.
`;
