const { generateContent } = require("./geminiClient");

/**
 * Explains code snippet or file content using Gemini
 * @param {string} code 
 * @param {string} filePath 
 * @param {string} [language] 
 * @returns {Promise<object>}
 */
async function explainCode(code, filePath = "snippet", language = "") {
  const prompt = `
You are an expert AI software engineer for forjeX, a modern code platform.
Analyze the following code and return a structured JSON explanation.

File Path: "${filePath}"
Language: "${language || "Auto-detect"}"

Code:
\`\`\`
${code}
\`\`\`

Return MUST be valid JSON with this exact schema:
{
  "summary": "1-2 sentence high-level overview of what this code does.",
  "detailed": "A thorough paragraph breaking down the step-by-step logic, architectural pattern, and data flow.",
  "beginner": "An easy-to-understand explanation using a real-world analogy (ELI5 format).",
  "complexity": "Simple" | "Moderate" | "Complex",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "potentialIssues": ["Any potential edge cases, null pointers, unhandled errors, or fragility noticed"]
}
`;

  const jsonResult = await generateContent(prompt, {
    json: true,
    temperature: 0.2,
  });

  try {
    return JSON.parse(jsonResult);
  } catch (err) {
    console.error("Failed to parse JSON from Gemini response:", jsonResult);
    return {
      summary: "Could not parse structured explanation.",
      detailed: jsonResult,
      beginner: "N/A",
      complexity: "Moderate",
      keyConcepts: [],
      potentialIssues: [],
    };
  }
}

module.exports = { explainCode };
