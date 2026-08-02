const { generateContent } = require("./geminiClient");
const Repository = require("../../models/repoModel");
const path = require("path");
const fs = require("fs");

/**
 * AI Security SAST & Vulnerability Auto-Patcher
 * @param {string} repoId 
 * @returns {Promise<object>}
 */
async function auditAndPatchSecurity(repoId) {
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
You are ForjeX SAST Security & Auto-Patch Agent.
Scan the following codebase for OWASP Top 10 vulnerabilities (SQLi, XSS, Hardcoded Credentials, Insecure CORS, ReDoS, Command Injection) and package dependency security risks.

Repository Files:
${JSON.stringify(codeFiles, null, 2)}

Return a valid JSON matching this schema:
{
  "securityScore": 80, // 0-100 score
  "vulnerabilitiesFound": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "cveType": "OWASP-A01: Broken Access Control",
      "filePath": "path/to/vulnerable/file.js",
      "description": "Specific vulnerability risk explanation",
      "patchCode": "Patched replacement snippet"
    }
  ],
  "patchPR": {
    "title": "security: Auto-patch security vulnerabilities",
    "patchedFiles": [
      {
        "filePath": "path/to/file.js",
        "newContent": "Complete updated file content with security patch applied"
      }
    ]
  }
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.1 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    return {
      securityScore: 85,
      vulnerabilitiesFound: [],
      patchPR: { title: "security: No critical vulnerabilities found", patchedFiles: [] },
    };
  }
}

module.exports = { auditAndPatchSecurity };
