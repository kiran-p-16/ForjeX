const { generateContent } = require("./geminiClient");
const Repository = require("../../models/repoModel");
const path = require("path");
const fs = require("fs");

/**
 * Natural language search & codebase Q&A over repository files
 * @param {string} repoId 
 * @param {string} query 
 * @returns {Promise<object>}
 */
async function searchCodebase(repoId, query) {
  const repo = await Repository.findById(repoId);
  if (!repo) {
    throw new Error("Repository not found");
  }

  const files = repo.content || [];
  const repoUploadDir = path.join(process.cwd(), "uploads", repoId.toString());

  // Read small text files for context
  const fileContexts = [];
  for (const relPath of files) {
    const fullPath = path.join(repoUploadDir, relPath.replace(/\\/g, "/"));
    if (fs.existsSync(fullPath)) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size < 50000) { // Limit to ~50KB per file
          const content = fs.readFileSync(fullPath, "utf-8");
          fileContexts.push({
            path: relPath,
            content,
          });
        }
      } catch (e) {
        // Skip binary or unreadable files
      }
    }
  }

  const prompt = `
You are a codebase intelligence agent for forjeX.
A developer is searching their repository using natural language.

User Search Query / Question: "${query}"

Repository Name: "${repo.name}"
Available Code Base Snippets:
${JSON.stringify(fileContexts.slice(0, 15), null, 2)}

Return a valid JSON response:
{
  "answer": "Direct answer to the user query explaining where and how it is handled in the code",
  "matches": [
    {
      "filePath": "path/to/matching/file.js",
      "relevance": "High" | "Medium" | "Low",
      "snippet": "Most relevant code block snippet",
      "explanation": "Why this snippet matches the query"
    }
  ]
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.1 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    return {
      answer: rawJson,
      matches: [],
    };
  }
}

module.exports = { searchCodebase };
