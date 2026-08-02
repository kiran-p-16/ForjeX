const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { explainCode } = require("../services/ai/codeExplainer");
const { reviewCodeFile } = require("../services/ai/codeReviewAgent");
const { triageIssue } = require("../services/ai/issueTriageAgent");
const { generateRepoReadme, generateFileDocs } = require("../services/ai/docGenerator");
const { generateCommitMessage, generateChangelog } = require("../services/ai/commitIntelligence");
const { searchCodebase } = require("../services/ai/semanticSearch");
const AiReview = require("../models/aiReviewModel");

const aiRouter = express.Router();

// Feature 6: Code Explainer
aiRouter.post("/ai/explain", authMiddleware, async (req, res) => {
  try {
    const { code, filePath, language } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code content is required" });
    }
    const explanation = await explainCode(code, filePath, language);
    res.json(explanation);
  } catch (err) {
    console.error("AI Explain Error:", err);
    res.status(500).json({ error: "AI Explanation failed" });
  }
});

// Feature 1: Smart Code Review
aiRouter.post("/ai/review/:repoId", authMiddleware, async (req, res) => {
  try {
    const { filePath, code } = req.body;
    if (!filePath || !code) {
      return res.status(400).json({ error: "filePath and code are required" });
    }
    const review = await reviewCodeFile(req.params.repoId, filePath, code);
    res.json(review);
  } catch (err) {
    console.error("AI Review Error:", err);
    res.status(500).json({ error: "AI Code Review failed" });
  }
});

aiRouter.get("/ai/review/:repoId", authMiddleware, async (req, res) => {
  try {
    const reviews = await AiReview.find({ repository: req.params.repoId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch AI reviews" });
  }
});

// Feature 2: AI Issue Triage
aiRouter.post("/ai/triage/:issueId", authMiddleware, async (req, res) => {
  try {
    const result = await triageIssue(req.params.issueId);
    res.json(result);
  } catch (err) {
    console.error("AI Triage Error:", err);
    res.status(500).json({ error: "AI Issue Triage failed" });
  }
});

// Feature 4: AI Documentation Generator
aiRouter.post("/ai/docs/:repoId/readme", authMiddleware, async (req, res) => {
  try {
    const readme = await generateRepoReadme(req.params.repoId);
    res.json({ readme });
  } catch (err) {
    console.error("AI Readme Error:", err);
    res.status(500).json({ error: "README generation failed" });
  }
});

aiRouter.post("/ai/docs/file", authMiddleware, async (req, res) => {
  try {
    const { filePath, code } = req.body;
    const docs = await generateFileDocs(filePath, code);
    res.json({ docs });
  } catch (err) {
    res.status(500).json({ error: "File docs generation failed" });
  }
});

// Feature 5: Commit Intelligence
aiRouter.post("/ai/commit/message", authMiddleware, async (req, res) => {
  try {
    const { diff, filePath } = req.body;
    const result = await generateCommitMessage(diff, filePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Commit message generation failed" });
  }
});

aiRouter.post("/ai/commit/changelog", authMiddleware, async (req, res) => {
  try {
    const { commits } = req.body;
    const changelog = await generateChangelog(commits || []);
    res.json({ changelog });
  } catch (err) {
    res.status(500).json({ error: "Changelog generation failed" });
  }
});

// Feature 3: Natural Language Code Search
aiRouter.post("/ai/search/:repoId", authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const searchResults = await searchCodebase(req.params.repoId, query);
    res.json(searchResults);
  } catch (err) {
    console.error("AI Search Error:", err);
    res.status(500).json({ error: "AI Code Search failed" });
  }
});

module.exports = aiRouter;
