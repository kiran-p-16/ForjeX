const { GoogleGenAI } = require("@google/genai");

let ai = null;

function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is not set in environment variables.");
    }
    ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });
  }
  return ai;
}

/**
 * Generate text content using Gemini
 * @param {string} prompt 
 * @param {object} options 
 * @returns {Promise<string>}
 */
async function generateContent(prompt, options = {}) {
  const client = getGeminiClient();
  const model = options.model || "gemini-2.5-flash";
  
  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens || 4096,
        responseMimeType: options.json ? "application/json" : "text/plain",
      },
    });

    return response.text;
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    throw err;
  }
}

/**
 * Generate vector embeddings for text
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  const client = getGeminiClient();
  try {
    const response = await client.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    return response.embedding.values;
  } catch (err) {
    console.error("Gemini Embedding Error:", err.message);
    throw err;
  }
}

module.exports = {
  generateContent,
  generateEmbedding,
};
