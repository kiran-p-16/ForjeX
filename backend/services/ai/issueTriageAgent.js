const { generateContent } = require("./geminiClient");
const Issue = require("../../models/issueModel");
const Repository = require("../../models/repoModel");

/**
 * Perform AI Triage on an Issue and update it in DB
 * @param {string} issueId 
 * @returns {Promise<object>}
 */
async function triageIssue(issueId) {
  const issue = await Issue.findById(issueId).populate("repository");
  if (!issue) {
    throw new Error("Issue not found");
  }

  const repo = issue.repository;
  const fileList = repo.content || [];

  const prompt = `
You are an AI DevOps & Issue Triage Assistant for forjeX.
Analyze the following issue report for repository "${repo.name}".

Issue Title: "${issue.title}"
Issue Description:
"""
${issue.description}
"""

Repository Files List:
${JSON.stringify(fileList, null, 2)}

Return a valid JSON object matching this exact schema:
{
  "suggestedLabels": ["bug", "security", "enhancement", "performance", "documentation"], // choose 1-3 appropriate labels
  "priority": "critical" | "high" | "medium" | "low",
  "affectedFiles": ["list of files from the repository file list that are most likely involved"],
  "analysis": "2-3 sentence technical diagnosis of what root cause might be",
  "suggestedFix": "Code snippet or step-by-step guidance to resolve this issue"
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.2 });

  let triageResult;
  try {
    triageResult = JSON.parse(rawJson);
  } catch (err) {
    console.error("Failed to parse Triage JSON:", rawJson);
    triageResult = {
      suggestedLabels: ["bug"],
      priority: "medium",
      affectedFiles: [],
      analysis: "Automated analysis completed.",
      suggestedFix: "Review logs and inspect relevant component state.",
    };
  }

  // Auto-apply suggested labels to issue if empty
  if (triageResult.suggestedLabels && Array.isArray(triageResult.suggestedLabels)) {
    const uniqueLabels = [...new Set([...(issue.labels || []), ...triageResult.suggestedLabels])];
    issue.labels = uniqueLabels;
  }

  // Add AI Triage as a comment if not already triaged
  const hasAiComment = issue.comments.some((c) => c.body.includes("🤖 **AI Issue Triage**"));
  if (!hasAiComment) {
    const commentBody = `🤖 **AI Issue Triage Report**

**Priority:** \`${triageResult.priority.toUpperCase()}\`
**Likely Affected Files:** ${triageResult.affectedFiles.map((f) => `\`${f}\``).join(", ") || "None specified"}

**Analysis:**
${triageResult.analysis}

**Suggested Resolution:**
\`\`\`
${triageResult.suggestedFix}
\`\`\``;

    // Use system / first author
    issue.comments.push({
      body: commentBody,
      author: issue.createdBy,
    });
  }

  await issue.save();

  return {
    issue,
    triage: triageResult,
  };
}

module.exports = { triageIssue };
