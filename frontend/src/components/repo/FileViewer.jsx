import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import Navbar from "../Navbar";
import API from "../../api/axios";
import "./fileViewer.css";

const FileViewer = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const filePath = params.get("path");

  const [repo, setRepo] = useState(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Modal & Drawer States
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiTab, setAiTab] = useState("explain"); // 'explain' | 'review' | 'docs'
  const [aiLoading, setAiLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [review, setReview] = useState(null);
  const [fileDocs, setFileDocs] = useState("");
  
  // Commit Message Modal State
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);

  const userId = localStorage.getItem("userId");

  const isOwner = useMemo(() => {
    return repo?.owner?._id === userId;
  }, [repo, userId]);

  // Language detection from file extension
  const detectedLanguage = useMemo(() => {
    if (!filePath) return "plaintext";
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      case "py":
        return "python";
      case "md":
        return "markdown";
      case "java":
        return "java";
      case "c":
      case "cpp":
        return "cpp";
      case "go":
        return "go";
      case "rs":
        return "rust";
      default:
        return "plaintext";
    }
  }, [filePath]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const repoRes = await API.get(`/repo/${id}`);
      setRepo(repoRes.data);

      const fileRes = await API.get(`/repo/${id}/file`, {
        params: { path: filePath },
      });

      setFile(fileRes.data);
      setText(fileRes.data.content);
    } catch (err) {
      console.error("FILE VIEW ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filePath) return;
    fetchAll();
  }, [id, filePath]);

  // AI Feature 6: Explain Code
  const handleExplainCode = async () => {
    setAiDrawerOpen(true);
    setAiTab("explain");
    if (explanation) return; // already fetched

    try {
      setAiLoading(true);
      const { data } = await API.post("/ai/explain", {
        code: text,
        filePath,
        language: detectedLanguage,
      });
      setExplanation(data);
    } catch (err) {
      console.error("Explain error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Feature 1: Smart Code Review (File level)
  const handleReviewCode = async () => {
    setAiDrawerOpen(true);
    setAiTab("review");

    try {
      setAiLoading(true);
      const { data } = await API.post(`/ai/review/${id}`, {
        filePath,
        code: text,
      });
      setReview(data);
    } catch (err) {
      console.error("Review error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const [unitTests, setUnitTests] = useState(null);

  // Fundamental Agent 3: Autonomous Test Generator
  const handleGenerateTests = async () => {
    setAiDrawerOpen(true);
    setAiTab("tests");

    try {
      setAiLoading(true);
      const { data } = await API.post("/ai/test/generate", {
        code: text,
        filePath,
        framework: "jest",
      });
      setUnitTests(data);
    } catch (err) {
      console.error("Test Gen error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Feature 4: Generate File Docs
  const handleGenerateDocs = async () => {
    setAiDrawerOpen(true);
    setAiTab("docs");

    try {
      setAiLoading(true);
      const { data } = await API.post("/ai/docs/file", {
        filePath,
        code: text,
      });
      setFileDocs(data.docs);
    } catch (err) {
      console.error("Docs error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Feature 5: AI Commit Message before saving
  const handleInitiateSave = async () => {
    setShowCommitModal(true);
    try {
      setCommitLoading(true);
      const { data } = await API.post("/ai/commit/message", {
        diff: text,
        filePath,
      });
      setCommitMessage(data.fullCommitMessage || data.subject);
    } catch (err) {
      setCommitMessage(`update ${filePath}`);
    } finally {
      setCommitLoading(false);
    }
  };

  const saveFile = async () => {
    try {
      setSaving(true);

      await API.put(`/repo/${id}/file`, {
        path: filePath,
        content: text,
      });

      setShowCommitModal(false);
      setEditing(false);
      await fetchAll();
    } catch (err) {
      console.error("SAVE FILE ERROR:", err);
      alert("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async () => {
    try {
      setDownloading(true);

      const res = await API.get(`/repo/${id}/download`, {
        params: { path: filePath },
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const fileName = filePath.split("/").pop() || "file";

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOWNLOAD ERROR:", err);
      alert("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (!filePath) {
    return (
      <>
        <Navbar />
        <div className="file-wrapper">
          <div className="file-error">No file selected</div>
        </div>
      </>
    );
  }

  if (loading || !repo || !file) return null;

  return (
    <>
      <Navbar />

      <section className="file-wrapper">
        {/* Header */}
        <div className="file-header">
          <div>
            <h2 className="file-title">{repo.name}</h2>
            <p className="file-path">
              <span>📄 {filePath}</span>
              <span className="lang-tag">{detectedLanguage}</span>
            </p>
          </div>

          <div className="file-actions">
            {/* AI Action Buttons */}
            <button className="btn ai-btn" onClick={handleExplainCode}>
              ✨ Explain Code
            </button>
            <button className="btn ai-btn" onClick={handleReviewCode}>
              🛡️ AI Audit
            </button>
            <button className="btn ai-btn" onClick={handleGenerateDocs}>
              📝 Gen Docs
            </button>
            <button className="btn ai-btn" onClick={handleGenerateTests}>
              🧪 Gen Tests
            </button>

            <button className="btn ghost" onClick={downloadFile} disabled={downloading}>
              {downloading ? "Downloading…" : "Download"}
            </button>

            <button className="btn ghost" onClick={() => navigate(`/repo/${id}`)}>
              Back to repo
            </button>

            {isOwner && (
              <>
                {!editing ? (
                  <button className="btn primary" onClick={() => setEditing(true)}>
                    Edit File
                  </button>
                ) : (
                  <>
                    <button className="btn ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                    <button className="btn primary" onClick={handleInitiateSave}>
                      Save Changes
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Code Layout with AI Sidecar */}
        <div className={`file-content-layout ${aiDrawerOpen ? "with-drawer" : ""}`}>
          <div className="file-card monaco-container">
            <Editor
              height="72vh"
              theme="vs-dark"
              language={detectedLanguage}
              value={text}
              onChange={(val) => setText(val || "")}
              options={{
                readOnly: !editing,
                minimap: { enabled: true },
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>

          {/* AI Sidecar Drawer */}
          {aiDrawerOpen && (
            <aside className="ai-sidecar">
              <div className="ai-sidecar-header">
                <div className="ai-tabs">
                  <button
                    className={aiTab === "explain" ? "active" : ""}
                    onClick={handleExplainCode}
                  >
                    ✨ Explain
                  </button>
                  <button
                    className={aiTab === "review" ? "active" : ""}
                    onClick={handleReviewCode}
                  >
                    🛡️ Audit
                  </button>
                  <button
                    className={aiTab === "docs" ? "active" : ""}
                    onClick={handleGenerateDocs}
                  >
                    📝 Docs
                  </button>
                  <button
                    className={aiTab === "tests" ? "active" : ""}
                    onClick={handleGenerateTests}
                  >
                    🧪 Tests
                  </button>
                </div>
                <button className="close-btn" onClick={() => setAiDrawerOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="ai-sidecar-body">
                {aiLoading ? (
                  <div className="ai-loading">
                    <div className="spinner"></div>
                    <p>Gemini AI is analyzing code…</p>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: EXPLANATION */}
                    {aiTab === "explain" && explanation && (
                      <div className="ai-section">
                        <div className="ai-badge complexity-badge">
                          Complexity: <strong>{explanation.complexity}</strong>
                        </div>

                        <h4>Summary</h4>
                        <p>{explanation.summary}</p>

                        <h4>Detailed Logic & Flow</h4>
                        <p>{explanation.detailed}</p>

                        <h4>Beginner Friendly (ELI5)</h4>
                        <p className="eli5-box">💡 {explanation.beginner}</p>

                        {explanation.keyConcepts?.length > 0 && (
                          <>
                            <h4>Key Concepts</h4>
                            <div className="pill-group">
                              {explanation.keyConcepts.map((c, i) => (
                                <span key={i} className="concept-pill">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </>
                        )}

                        {explanation.potentialIssues?.length > 0 && (
                          <>
                            <h4>Potential Fragilities</h4>
                            <ul>
                              {explanation.potentialIssues.map((issue, i) => (
                                <li key={i} className="warn-text">
                                  ⚠️ {issue}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 2: CODE REVIEW AUDIT */}
                    {aiTab === "review" && review && (
                      <div className="ai-section">
                        <div className="score-card">
                          <div className="score-circle">{review.score}</div>
                          <div>
                            <h4>Health Score</h4>
                            <p>{review.summary}</p>
                          </div>
                        </div>

                        <h4>Review Audit Items ({review.items?.length || 0})</h4>

                        {review.items?.length === 0 ? (
                          <p className="muted">No issues found. Code looks clean!</p>
                        ) : (
                          review.items?.map((item, idx) => (
                            <div key={idx} className={`review-item ${item.severity}`}>
                              <div className="item-header">
                                <span className={`severity-tag ${item.severity}`}>
                                  {item.severity}
                                </span>
                                {item.line && (
                                  <span className="line-no">Line {item.line}</span>
                                )}
                              </div>
                              <h5>{item.title}</h5>
                              <p>{item.description}</p>
                              {item.suggestion && (
                                <pre className="suggestion-code">{item.suggestion}</pre>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB 3: FILE DOCS */}
                    {aiTab === "docs" && (
                      <div className="ai-section">
                        <h4>Generated Documentation</h4>
                        <pre className="docs-preview">{fileDocs}</pre>
                      </div>
                    )}

                    {/* TAB 4: AUTONOMOUS UNIT TESTS */}
                    {aiTab === "tests" && unitTests && (
                      <div className="ai-section">
                        <div className="ai-badge complexity-badge">
                          Est. Coverage: <strong>{unitTests.estimatedCoverage}</strong>
                        </div>
                        <h4>Generated Test Suite ({unitTests.testFileName})</h4>
                        <pre className="docs-preview">{unitTests.testCode}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* AI Commit Message Modal */}
      {showCommitModal && (
        <div className="modal-overlay" onClick={() => setShowCommitModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🤖 AI Commit Message Assistant</h3>
              <button className="modal-close" onClick={() => setShowCommitModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {commitLoading ? (
                <div className="ai-loading">
                  <div className="spinner"></div>
                  <p>Generating Conventional Commit message from your diff…</p>
                </div>
              ) : (
                <>
                  <label>Commit Message Suggested by Gemini:</label>
                  <textarea
                    rows={4}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setShowCommitModal(false)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={saveFile}
                disabled={saving || commitLoading}
              >
                {saving ? "Saving Commit…" : "Confirm & Push Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileViewer;