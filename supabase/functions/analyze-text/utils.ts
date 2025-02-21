/**
 * utils.ts
 *
 * This file contains prompt constants to be imported into your API calls.
 * The ALTERNATIVE_PROMPT instructs the AI to analyze historical Arabic texts
 * and output the results using a custom plain-text format.
 *
 * Expected output format:
 *
 * RESULT_START:
 * ENTITIES:
 * - [entity text] | [entity type] | related: [related entity text1]; [related entity text2]
 * - [another entity] | [another type] | related:
 * RELATIONSHIPS:
 * - [source entity] -> [target entity] | [relationship type]
 * - [another source] -> [another target] | [relationship type]
 * RESULT_END:
 *
 * Do not include any additional text, markdown, or formatting.
 */

export const ALTERNATIVE_PROMPT = `
You are an AI assistant that analyzes historical texts written in Arabic.
Your task is to:
1. Identify key entities (events, people, causes, and factors in political, economic, social, and cultural domains).
2. Classify each entity into one of the following types: event, person, cause, political, economic, social, cultural.
3. Identify relationships between these entities.

Return your output strictly in the following format without any additional text or formatting:

RESULT_START:
ENTITIES:
- [entity text] | [entity type] | related: [related entity text1]; [related entity text2]
- [another entity] | [another type] | related:
RELATIONSHIPS:
- [source entity] -> [target entity] | [relationship type]
- [another source] -> [another target] | [relationship type]
RESULT_END:
`;
