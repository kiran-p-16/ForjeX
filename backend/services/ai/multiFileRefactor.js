const { generateContent } = require("./geminiClient");
const Repository = require("../../models/repoModel");
const path = require("path");
const fs = require("fs");

/**
 * Agentic Multi-File Refactor Engine
 * @param {string} repoId 
 * @param {string} refactorInstruction 
 * @returns {Promise<object>}
 */
async function performMultiFileRefactor(repoId, refactorInstruction) {
  const repo = await Repository.findById(repoId);
  if (!repo) throw new Error("Repository not found");

  const repoUploadDir = path.join(process.cwd(), "uploads", repoId.toString());
  const files = repo.content || [];

  const codeFiles = [];
  for (const relPath of files) {
    const fullPath = path.join(repoUploadDir, relPath.replace(/\\/g, "/"));
    if (fs.existsSync(fullPath)) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size < 50000) {
          codeFiles.push({
            path: relPath,
            content: fs.readFileSync(fullPath, "utf-8"),
          });
        }
      } catch (e) {}
    }
  }

  const prompt = `
You are ForjeX Agentic Refactor Engine.
Refactor the codebase according to this instruction: "${refactorInstruction}"

Repository Name: "${repo.name}"
Codebase Files:
${JSON.stringify(codeFiles, null, 2)}

Return a valid JSON matching this schema:
{
  "summary": "Overview of refactoring actions performed",
  "refactoredFiles": [
    {
      "filePath": "path/to/modified/file.js",
      "explanation": "What specific change was made in this file",
      "newContent": "Complete updated file content"
    }
  ]
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.1 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    throw new Error("Multi-file refactor failed to parse JSON");
  }
}

module.exports = { performMultiFileRefactor };
