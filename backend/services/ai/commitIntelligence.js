const { generateContent } = require("./geminiClient");

/**
 * Generates Conventional Commit message based on code changes/diff
 * @param {string} diffOrContent 
 * @param {string} [filePath] 
 * @returns {Promise<object>}
 */
async function generateCommitMessage(diffOrContent, filePath = "") {
  const prompt = `
You are a git commit intelligence AI for forjeX.
Analyze the following code changes and generate a professional Conventional Commit message.

File Path: "${filePath}"
Changes:
\`\`\`
${diffOrContent}
\`\`\`

Return a valid JSON matching this schema:
{
  "type": "feat" | "fix" | "docs" | "style" | "refactor" | "perf" | "test" | "chore",
  "scope": "short scope e.g. auth, api, repo",
  "subject": "imperative sentence max 60 chars e.g. add JWT authentication middleware",
  "fullCommitMessage": "feat(scope): subject\\n\\nDetailed bullet points explaining why and what changed.",
  "qualityScore": 95 // 0-100 score of change clarity
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.2 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    return {
      type: "chore",
      scope: "code",
      subject: "update codebase files",
      fullCommitMessage: "chore(code): update codebase files",
      qualityScore: 80,
    };
  }
}

/**
 * Generate release changelog from commit messages
 * @param {Array<{message: string, date: string}>} commits 
 * @returns {Promise<string>}
 */
async function generateChangelog(commits) {
  const prompt = `
Generate a structured, professional CHANGELOG.md for a release based on these commit logs:

Commits:
${JSON.stringify(commits, null, 2)}

Group changes into:
- 🚀 Features
- 🐛 Bug Fixes
- 🔒 Security & Refactor
- 🧹 Maintenance

Return raw Markdown.
`;

  const changelog = await generateContent(prompt, { temperature: 0.3 });
  return changelog.replace(/^```markdown\n/, "").replace(/\n```$/, "");
}

module.exports = {
  generateCommitMessage,
  generateChangelog,
};
