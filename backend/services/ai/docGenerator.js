const { generateContent } = require("./geminiClient");
const Repository = require("../../models/repoModel");

/**
 * Generate a complete README.md for a repository based on its structure and description
 * @param {string} repoId 
 * @returns {Promise<string>}
 */
async function generateRepoReadme(repoId) {
  const repo = await Repository.findById(repoId).populate("owner", "username");
  if (!repo) {
    throw new Error("Repository not found");
  }

  const prompt = `
You are a technical documentation architect for forjeX.
Generate a comprehensive, beautifully formatted GitHub-style README.md for the following repository.

Repository Name: "${repo.name}"
Description: "${repo.description || "No description provided."}"
Owner: "${repo.owner?.username || "Developer"}"
Files in Repository:
${JSON.stringify(repo.content || [], null, 2)}

Requirements for README.md:
1. Include a catchy header with badges (License, Tech, Version)
2. Project Overview & Features
3. Technology Stack table
4. Project Directory Structure
5. Getting Started & Installation guide
6. API & Architecture Overview
7. License & Credits

Return ONLY the raw markdown content. Do NOT wrap in markdown code blocks like \`\`\`markdown ... \`\`\`.
`;

  const readmeMarkdown = await generateContent(prompt, { temperature: 0.3 });
  return readmeMarkdown.replace(/^```markdown\n/, "").replace(/\n```$/, "");
}

/**
 * Generate documentation for a single code file
 * @param {string} filePath 
 * @param {string} code 
 * @returns {Promise<string>}
 */
async function generateFileDocs(filePath, code) {
  const prompt = `
You are an expert developer documentation generator for forjeX.
Generate clean API/Module documentation for the file "${filePath}".

Code:
\`\`\`
${code}
\`\`\`

Include:
- Module summary
- Function / Export signatures with param types and return values
- Usage example code block
- Dependencies and prerequisites

Return ONLY clean markdown documentation.
`;

  const docs = await generateContent(prompt, { temperature: 0.2 });
  return docs.replace(/^```markdown\n/, "").replace(/\n```$/, "");
}

module.exports = {
  generateRepoReadme,
  generateFileDocs,
};
