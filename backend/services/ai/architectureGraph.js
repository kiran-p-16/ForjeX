const { generateContent } = require("./geminiClient");
const Repository = require("../../models/repoModel");
const path = require("path");
const fs = require("fs");

/**
 * Generates interactive Mermaid.js Architecture Diagram & Data Flow Map for a repository
 * @param {string} repoId 
 * @returns {Promise<object>}
 */
async function generateArchitectureGraph(repoId) {
  const repo = await Repository.findById(repoId);
  if (!repo) throw new Error("Repository not found");

  const repoUploadDir = path.join(process.cwd(), "uploads", repoId.toString());
  const files = repo.content || [];

  const fileSummaries = [];
  for (const relPath of files) {
    const fullPath = path.join(repoUploadDir, relPath.replace(/\\/g, "/"));
    if (fs.existsSync(fullPath)) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size < 50000) {
          fileSummaries.push({
            path: relPath,
            snippet: fs.readFileSync(fullPath, "utf-8").slice(0, 800), // First 800 chars
          });
        }
      } catch (e) {}
    }
  }

  const prompt = `
You are a Software System Architect AI for forjeX.
Analyze the files and structure of repository "${repo.name}" and generate a Mermaid.js architecture diagram.

File Structure & Imports:
${JSON.stringify(fileSummaries, null, 2)}

Return a valid JSON matching this schema:
{
  "mermaidDiagram": "graph TD\\n  A[Frontend UI] --> B[API Router]\\n  ...",
  "architectureOverview": "High level description of the system architecture pattern (MVC, Microservices, Monolith, etc.)",
  "components": [
    {
      "name": "Component or Module Name",
      "role": "Description of responsibility",
      "dependencies": ["Dep1", "Dep2"]
    }
  ]
}

Rules for Mermaid Diagram:
- Use standard Mermaid syntax (\`graph TD\` or \`graph LR\`).
- Ensure node names don't contain invalid special characters.
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.2 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    return {
      mermaidDiagram: `graph TD\n  Client[Frontend Client] --> API[Express API Server]\n  API --> DB[(MongoDB Database)]`,
      architectureOverview: "Standard Web Application Architecture",
      components: [],
    };
  }
}

module.exports = { generateArchitectureGraph };
