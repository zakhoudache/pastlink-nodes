import { corsHeaders } from "../shared-one/cors.ts";
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@^0.3.0';

const VALID_RELATIONSHIP_TYPES = [
  'caused-by',
  'led-to',
  'influenced',
  'part-of',
  'opposed-to',
  'related-to'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { text, temperature } = requestBody;

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({
          error: "حقل 'text' مطلوب ولا يمكن أن يكون فارغًا."
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("لم يتم تعيين متغير البيئة GEMINI_API_KEY.");
    }
   
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      }
    });

    const prompt = `حلل هذا النص التاريخي واستخرج العلاقات والكيانات المذكورة فيه. أعد فقط كائن JSON صالح يطابق هذا الهيكل، دون أي نص إضافي أو تنسيق:

    {
      "events": [
        {
          "date": "السنة أو التاريخ المحدد",
          "description": "وصف تفصيلي للحدث"
        }
      ],
      "people": ["قائمة بأهم الشخصيات المذكورة"],
      "locations": ["قائمة بالمواقع الجغرافية المذكورة"],
      "terms": ["قائمة بالمصطلحات أو المفاهيم التاريخية الأساسية"],
      "relationships": [
        {
          "source": "اسم الكيان (شخص، حدث، موقع)",
          "target": "اسم الكيان المرتبط به",
          "type": "نوع العلاقة"
        }
      ]
    }

    ### الشروط:
    1. يجب أن يكون نوع العلاقة واحدًا من الأنواع التالية فقط: ${VALID_RELATIONSHIP_TYPES.join(', ')}
    2. يجب أن يكون المصدر والهدف كيانين حقيقيين مذكورين في النص.
    3. يجب أن تحتوي كل قائمة على عنصر واحد على الأقل.
    4. يجب أن يكون تنسيق التواريخ متسقًا.
    5. يجب أن تكون الأوصاف مفصلة ولكن مختصرة.

    **النص للتحليل:** ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // محاولة استخراج JSON إذا كان محاطًا بعلامات تنسيق
    if (!responseText.startsWith('{')) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (error: any) {
      console.error("فشل تحليل استجابة API إلى JSON:", error);
      console.error("النص المستلم:", responseText);
      throw new Error(`فشل تحليل استجابة API إلى JSON: ${error.message}`);
    }
   
    try {
      // التحقق من وجود القوائم
      ['events', 'people', 'locations', 'terms', 'relationships'].forEach(key => {
        if (!Array.isArray(jsonResponse[key])) {
          jsonResponse[key] = [];
        }
      });

      // تنظيف العلاقات والتحقق من صحتها
      jsonResponse.relationships = jsonResponse.relationships
        .filter((rel: any) => 
          rel?.source && 
          rel?.target && 
          rel?.type &&
          typeof rel.source === 'string' &&
          typeof rel.target === 'string' &&
          typeof rel.type === 'string'
        )
        .map((rel: any) => ({
          ...rel,
          // تحويل نوع العلاقة إلى الصيغة الصحيحة أو القيمة الافتراضية
          type: VALID_RELATIONSHIP_TYPES.includes(rel.type.toLowerCase().replace(/ /g, '-')) 
            ? rel.type.toLowerCase().replace(/ /g, '-')
            : 'related-to'
        }));

      // تنظيف الأحداث والتحقق من صحتها
      jsonResponse.events = jsonResponse.events
        .filter((event: any) =>
          event?.date &&
          event?.description &&
          typeof event.date === 'string' &&
          typeof event.description === 'string'
        );

      // التأكد من أن القوائم ليست فارغة
      if (jsonResponse.relationships.length === 0) {
        jsonResponse.relationships.push({
          source: jsonResponse.people[0] || jsonResponse.locations[0] || "غير معروف",
          target: jsonResponse.terms[0] || "حدث",
          type: "related-to"
        });
      }

      return new Response(
        JSON.stringify(jsonResponse), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache" 
          },
        }
      );

    } catch (error: any) {
      throw new Error(`خطأ أثناء التحقق من الاستجابة: ${error.message}`);
    }

  } catch (error: any) {
    console.error("خطأ:", error);
    return new Response(
      JSON.stringify({
        error: "حدث خطأ أثناء المعالجة",
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
