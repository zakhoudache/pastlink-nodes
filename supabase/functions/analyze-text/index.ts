import { corsHeaders } from "../shared-one/cors";
import { ALTERNATIVE_PROMPT } from "./utils";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req) => {
  // Handle CORS preflight requests.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" },
    });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        "Error: Invalid request body. Failed to parse input.",
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const { text } = requestBody;
    if (!text) {
      console.error("Missing required text field");
      return new Response("Error: Missing required field 'text'.", {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!GEMINI_API_KEY) {
      console.error("Missing Gemini API key");
      return new Response(
        "Error: Server configuration error. Missing API key.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    // Build the prompt using Arabic text, instructing plain text output without any structured format hints.
    const prompt = `
${ALTERNATIVE_PROMPT}

النص لتحليله:
${text}

يرجى تحليل النص واستخراج العلاقات بين الكيانات. يجب أن يكون إخراجك بتنسيق JSON صالح، مع بنية تحتوي على مصفوفة من العلاقات. كل علاقة يجب أن تتضمن "source" (الكيان المصدر)، و "target" (الكيان الهدف)، و "type" (نوع العلاقة). لا تقم بتضمين أي نص أو شرح إضافي قبل أو بعد JSON.

مثال على الإخراج:
\`\`\`
{
  "relationships": [
    {
      "source": "[الكيان المصدر]",
      "target": "[الكيان الهدف]",
      "type": "[نوع العلاقة]"
    }
  ]
}
\`\`\`
`;

    // Call Gemini API.
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: prompt,
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Error parsing Gemini API response:", error);
      return new Response(
        "Error: API error. Failed to parse Gemini API response.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
    if (!response.ok) {
      console.error("Gemini API error:", data);
      return new Response("Error: API error. Error calling Gemini API.", {
        status: 500,
        headers: corsHeaders,
      });
    }
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Invalid Gemini API response structure:", data);
      return new Response(
        "Error: API error. Invalid response structure from Gemini API.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const fullText = data.candidates[0].content.parts[0].text;

    // Use a regular expression to extract the JSON object from the response.
    const jsonMatch = fullText.match(/```json\n(.*)\n```/s);
    let jsonString: string | null = null;
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else {
      console.error("Could not find JSON object in output:", fullText);
      return new Response(
        "Error: Extraction error. JSON object not found in API response.",
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    // Parse the JSON object.
    let jsonResponse: any;
    if (jsonString) {
      try {
        jsonResponse = JSON.parse(jsonString);
      } catch (error) {
        console.error("Error parsing JSON object:", error);
        console.error("JSON string:", jsonString);
        return new Response("Error: API error. Failed to parse JSON object.", {
          status: 500,
          headers: corsHeaders,
        });
      }
    } else {
      console.error("JSON string is null");
      return new Response("Error: API error. JSON string is null.", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Return the JSON object as a JSON response.
    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      `Unexpected error: ${
        error instanceof Error ? error.message : "An unknown error occurred"
      }`,
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
