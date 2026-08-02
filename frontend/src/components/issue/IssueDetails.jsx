import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import API from "../../api/axios";
import "./issue.css";

const IssueDetails = () => {
  const { id, issueId } = useParams();
  const navigate = useNavigate();

  const [repo, setRepo] = useState(null);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // AI Triage & Comment State
  const [triageLoading, setTriageLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const userId = localStorage.getItem("userId");

  const isOwner = useMemo(() => {
    return repo?.owner?._id === userId;
  }, [repo, userId]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const repoRes = await API.get(`/repo/${id}`);
      setRepo(repoRes.data);

      const issueRes = await API.get(`/issue/${issueId}`);
      setIssue(issueRes.data);

      setTitle(issueRes.data.title || "");
      setDescription(issueRes.data.description || "");
    } catch (err) {
      console.error("ISSUE DETAILS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id, issueId]);

  // Feature 2: Run AI Issue Triage
  const handleAiTriage = async () => {
    try {
      setTriageLoading(true);
      await API.post(`/ai/triage/${issueId}`);
      await fetchAll();
    } catch (err) {
      console.error("AI Triage Error:", err);
      alert("AI Triage failed");
    } finally {
      setTriageLoading(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentSubmitting(true);
      await API.post(`/issue/${issueId}/comment`, {
        body: newComment,
      });
      setNewComment("");
      await fetchAll();
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/issue/${issueId}/comment/${commentId}`);
      await fetchAll();
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const toggleStatus = async () => {
    if (!isOwner) return;

    try {
      setSaving(true);

      await API.put(`/issue/update/${issueId}`, {
        status: issue.status === "open" ? "closed" : "open",
      });

      await fetchAll();
    } catch (err) {
      console.error("TOGGLE STATUS ERROR:", err);
      alert("Failed to update issue status");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    if (!issue) return;
    setTitle(issue.title || "");
    setDescription(issue.description || "");
    setEditing(true);
  };

  const cancelEdit = () => {
    if (!issue) return;
    setTitle(issue.title || "");
    setDescription(issue.description || "");
    setEditing(false);
  };

  const saveEdits = async () => {
    if (!isOwner) return;

    if (!title.trim() || !description.trim()) {
      alert("Title and description cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      await API.put(`/issue/update/${issueId}`, {
        title: title.trim(),
        description: description.trim(),
      });

      setEditing(false);
      await fetchAll();
    } catch (err) {
      console.error("SAVE ISSUE ERROR:", err);
      alert("Failed to save issue");
    } finally {
      setSaving(false);
    }
  };

  const deleteIssue = async () => {
    if (!isOwner) return;

    const ok = window.confirm("Delete this issue permanently?");
    if (!ok) return;

    try {
      setDeleting(true);
      await API.delete(`/issue/delete/${issueId}`);
      navigate(`/repo/${id}/issues`);
    } catch (err) {
      console.error("DELETE ISSUE ERROR:", err);
      alert("Failed to delete issue");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !repo || !issue) return null;

  return (
    <>
      <Navbar />

      <section className="issues-wrapper">
        <div className="issues-header">
          <div>
            <h2 className="issues-title">{repo.name} / Issue</h2>
            <p className="issues-subtitle">{issue.title}</p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn ai-btn"
              onClick={handleAiTriage}
              disabled={triageLoading}
            >
              {triageLoading ? "🤖 Triaging…" : "🤖 Run AI Triage"}
            </button>

            <button
              className="btn ghost"
              onClick={() => navigate(`/repo/${id}/issues`)}
            >
              Back to issues
            </button>
          </div>
        </div>

        <div className="issue-details-card">
          <div className="issue-details-top">
            <div className="issue-meta-tags">
              <span
                className={`issue-status ${
                  issue.status === "open" ? "open" : "closed"
                }`}
              >
                {issue.status === "open" ? "● Open" : "● Closed"}
              </span>

              {issue.labels?.map((label, i) => (
                <span key={i} className="issue-label-pill">
                  🏷️ {label}
                </span>
              ))}
            </div>

            {isOwner && (
              <div className="issue-actions">
                {!editing ? (
                  <>
                    <button
                      className="btn ghost"
                      onClick={toggleStatus}
                      disabled={saving || deleting}
                    >
                      {issue.status === "open" ? "Close Issue" : "Reopen Issue"}
                    </button>

                    <button
                      className="btn ghost"
                      onClick={startEdit}
                      disabled={saving || deleting}
                    >
                      Edit
                    </button>

                    <button
                      className="btn danger"
                      onClick={deleteIssue}
                      disabled={saving || deleting}
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn ghost"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn primary"
                      onClick={saveEdits}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <h3 className="issue-big-title">{issue.title}</h3>
              <pre className="issue-description">{issue.description}</pre>
            </>
          ) : (
            <>
              <label className="issues-label">Title</label>
              <input
                className="issues-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label className="issues-label">Description</label>
              <textarea
                className="issues-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </>
          )}

          {/* Comments Timeline */}
          <div className="issue-comments-section">
            <h4>Activity & Comments ({issue.comments?.length || 0})</h4>

            {issue.comments?.map((comment) => (
              <div
                key={comment._id}
                className={`comment-box ${
                  comment.body.includes("🤖 **AI Issue Triage") ? "ai-triage-comment" : ""
                }`}
              >
                <div className="comment-header">
                  <strong>
                    {comment.body.includes("🤖 **AI Issue Triage")
                      ? "🤖 Gemini AI Triage Bot"
                      : comment.author?.username || "Developer"}
                  </strong>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>

                  {comment.author?._id === userId && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <pre className="comment-body">{comment.body}</pre>
              </div>
            ))}

            {/* Add Comment Box */}
            <form className="add-comment-form" onSubmit={handleAddComment}>
              <textarea
                placeholder="Leave a comment…"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                className="btn primary"
                disabled={commentSubmitting || !newComment.trim()}
              >
                {commentSubmitting ? "Posting…" : "Comment"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default IssueDetails;