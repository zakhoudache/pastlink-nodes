import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    // Build the prompt instructing plain text output without any formatting hints.
    const prompt = `
يرجى تحليل النص التاريخي التالي وتقديم ملخص شامل باللغة العربية.
يجب أن يتضمن الملخص الأحداث الرئيسية، الشخصيات، والمفاهيم، مع شرح للعلاقات بين العناصر،
وتسليط الضوء على الأسباب والنتائج الرئيسية بما يشمل العوامل السياسية والاقتصادية والاجتماعية والثقافية.

بعد الانتهاء من الملخص، في سطر جديد، قم بإدراج قسم العلاقات باستخدام التنسيق التالي:

RELATIONSHIPS:
- [الكيان المصدر] -> [الكيان الهدف] | [نوع العلاقة]

يرجى تقديم الإخراج كنص عادي فقط، بدون استخدام أي تنسيق برمجي أو أي مصطلحات تدل على تنسيق معين.

النص لتحليله:
${text}
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Gemini API response:", data);
    const fullText = data.candidates[0].content.parts[0].text;

    // Assume the output starts with the Arabic summary, followed by the marker "RELATIONSHIPS:"
    const marker = "RELATIONSHIPS:";
    const markerIndex = fullText.indexOf(marker);
    let summary: string, relationships: string;
    if (markerIndex !== -1) {
      summary = fullText.substring(0, markerIndex).trim();
      relationships = fullText.substring(markerIndex).trim();
    } else {
      summary = fullText.trim();
      relationships = "لم يتم تقديم معلومات عن العلاقات.";
    }

    // Combine summary and relationships into one plain text output.
    const output = `SUMMARY (Arabic):\n${summary}\n\n${relationships}`;
    return new Response(output, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
