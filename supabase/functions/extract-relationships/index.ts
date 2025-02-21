const http = require('http');
const { corsHeaders } = require("../shared-one/cors");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const server = http.createServer(async (req: any, res: any) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, { ...corsHeaders, "Access-Control-Max-Age": "86400" });
    res.end();
    return;
  }

  try {
    let requestBody = '';
    req.on('data', (chunk: any) => {
      requestBody += chunk;
    });

    req.on('end', async () => {
      const { text } = JSON.parse(requestBody);

      if (!text) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required field 'text'." }));
        return;
      }

      if (!GEMINI_API_KEY) {
        res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server configuration error. Missing API key." }));
        return;
      }

      // Simplified prompt that requests exact JSON structure
      const prompt = `
Analyze the following Arabic text and extract relationships between entities. 
Return ONLY a JSON object with the following structure, no other text:
{
  "relationships": [
    {
      "source": "entity1",
      "target": "entity2",
      "type": "relationship type"
    }
  ]
}

Text to analyze:
${text}
`;

      const geminiResponse = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GEMINI_API_KEY}`
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
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();

      if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid API response structure");
      }

      const geminiResponseText = geminiData.candidates[0].content.parts[0].text.trim();

      try {
        // Parse the response directly as JSON
        const jsonResponse = JSON.parse(geminiResponseText);

        // Validate the response structure
        if (!Array.isArray(jsonResponse.relationships)) {
          throw new Error("Invalid response format: relationships array missing");
        }

        // Validate each relationship object
        jsonResponse.relationships = jsonResponse.relationships.filter(rel =>
          rel.source && rel.target && rel.type &&
          typeof rel.source === 'string' &&
          typeof rel.target === 'string' &&
          typeof rel.type === 'string'
        );

        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(jsonResponse));

      } catch (error: any) {
        console.error("Error:", error);
        res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Processing error", details: error.message }));
      }
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Processing error", details: error.message }));
  }
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
