const { generateContent } = require("./geminiClient");
const Issue = require("../../models/issueModel");
const Repository = require("../../models/repoModel");
const path = require("path");
const fs = require("fs");

/**
 * Autonomous Agent: Resolves an issue by generating a multi-file code fix PR
 * @param {string} issueId 
 * @returns {Promise<object>}
 */
async function resolveIssueWithAgent(issueId) {
  const issue = await Issue.findById(issueId).populate("repository");
  if (!issue) throw new Error("Issue not found");

  const repo = issue.repository;
  const repoUploadDir = path.join(process.cwd(), "uploads", repo._id.toString());
  const files = repo.content || [];

  // Read files for full context
  const fileContents = [];
  for (const relPath of files) {
    const fullPath = path.join(repoUploadDir, relPath.replace(/\\/g, "/"));
    if (fs.existsSync(fullPath)) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size < 50000) {
          fileContents.push({
            path: relPath,
            content: fs.readFileSync(fullPath, "utf-8"),
          });
        }
      } catch (e) {}
    }
  }

  const prompt = `
You are ForjeX Autonomous Developer Agent.
Your job is to read an issue report, inspect the codebase, and write a complete multi-file code solution.

Issue Title: "${issue.title}"
Issue Description:
"""
${issue.description}
"""

Repository Files & Code:
${JSON.stringify(fileContents, null, 2)}

Return a valid JSON matching this schema:
{
  "prTitle": "fix(scope): short summary of the fix",
  "branchName": "ai-fix/issue-${issueId.toString().slice(-6)}",
  "summary": "Detailed explanation of what root cause was found and how this fix resolves it.",
  "changedFiles": [
    {
      "filePath": "path/to/file.js",
      "action": "modify" | "create",
      "explanation": "Why this file was modified",
      "newContent": "Complete updated file content with the fix applied"
    }
  ]
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.1 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    console.error("Agent resolve parse error:", rawJson);
    throw new Error("AI Agent failed to parse code fix PR");
  }
}

module.exports = { resolveIssueWithAgent };
