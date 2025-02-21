import { corsHeaders } from "../shared-one/cors";
import { ALTERNATIVE_PROMPT } from "./utils";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req) => {
  // التعامل مع طلبات CORS المسبقة
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
        "Error: Invalid request body. Failed to parse JSON.",
        {
          status: 400,
          headers: corsHeaders,
        }
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
        }
      );
    }

    // بناء التعليمات باستخدام النص العربي
    const prompt = `
${ALTERNATIVE_PROMPT}

النص لتحليله:
${text}

يرجى تحليل النص واستخراج المعلومات التالية بالنص العادي. استخدم العلامتين RESULT_START: و RESULT_END: لاحتواء الإخراج النهائي.

يجب أن يكون إخراجك بالتنسيق التالي:

الكيانات:
- كيان: [نص الكيان], النوع: [نوع الكيان], مرتبط بـ: [الكيان المرتبط 1; الكيان المرتبط 2; ...]

العلاقات:
- [الكيان المصدر] -> [الكيان الهدف], النوع: [نوع العلاقة]

تأكد من عدم استخدام أي تنسيق JSON؛ فقط استخدم النص العادي.
`;

    // استدعاء Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
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
      // console.log(data);
    } catch (error) {
      console.error("Error parsing Gemini API response:", error);
      return new Response(
        "Error: API error. Failed to parse Gemini API response.",
        {
          status: 500,
          headers: corsHeaders,
        }
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
        }
      );
    }

    const fullText = data.candidates[0].content.parts[0].text;

    // استخراج الإخراج بين العلامتين RESULT_START: و RESULT_END:
    const startMarker = "RESULT_START:";
    const endMarker = "RESULT_END:";
    const startIndex = fullText.indexOf(startMarker);
    const endIndex = fullText.lastIndexOf(endMarker);
    if (startIndex === -1 || endIndex === -1) {
      console.error("Could not find valid markers in output:", fullText);
      return new Response(
        "Error: Extraction error. Markers not found in API response.",
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    const extracted = fullText
      .substring(startIndex + startMarker.length, endIndex)
      .trim();

    // إعادة الإخراج النصي مباشرة
    return new Response(extracted, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
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
      }
    );
  }
});
