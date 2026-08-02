const { generateContent } = require("./geminiClient");
const AiReview = require("../../models/aiReviewModel");

/**
 * Perform AI code review on a file and save to DB
 * @param {string} repoId 
 * @param {string} filePath 
 * @param {string} code 
 * @returns {Promise<object>}
 */
async function reviewCodeFile(repoId, filePath, code) {
  const prompt = `
You are a lead code reviewer performing an automated AI code review for forjeX.
Analyze the given file for bugs, security vulnerabilities, performance bottlenecks, code style issues, and best practices.

File Path: "${filePath}"

Code:
\`\`\`
${code}
\`\`\`

Return a valid JSON object matching this exact schema:
{
  "score": 85, // integer 0-100 estimating overall code quality & security health
  "summary": "High level summary of code health and key findings",
  "items": [
    {
      "severity": "critical" | "warning" | "suggestion" | "praise",
      "line": 12, // line number if specific, or null
      "title": "Short title of issue",
      "description": "Detailed explanation of why this is an issue and its potential impact",
      "suggestion": "Specific corrected code snippet or null if not applicable",
      "category": "bug" | "security" | "performance" | "style" | "best-practice"
    }
  ]
}

Rules:
- Be thorough but fair.
- Include line numbers whenever applicable.
- For security issues (SQL injection, XSS, exposed secrets, unvalidated input), set severity to "critical".
- Include at least 1 "praise" item if the code demonstrates good design patterns.
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.1 });

  let reviewData;
  try {
    reviewData = JSON.parse(rawJson);
  } catch (err) {
    console.error("Failed to parse review JSON:", rawJson);
    reviewData = {
      score: 75,
      summary: "AI review completed with raw output.",
      items: [],
    };
  }

  // Update or insert into DB
  const reviewRecord = await AiReview.findOneAndUpdate(
    { repository: repoId, filePath },
    {
      repository: repoId,
      filePath,
      items: reviewData.items || [],
      score: reviewData.score || 80,
      summary: reviewData.summary || "",
      modelUsed: "gemini-2.5-flash",
    },
    { upsert: true, new: true }
  );

  return reviewRecord;
}

module.exports = { reviewCodeFile };
