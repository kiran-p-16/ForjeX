import React, { useState } from "react";
import API from "../../api/axios";
import "./issue.css";

const CreateIssueModal = ({ repoId, onClose, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await API.post(`/issue/create/${repoId}`, {
        title,
        description,
      });

      onCreated?.(data);
      onClose();
    } catch (err) {
      console.error("CREATE ISSUE ERROR:", err);
      setError(err.response?.data?.error || "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issue-modal-backdrop" onClick={onClose}>
      <div
        className="issue-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="issue-modal-header">
          <h3>Create Issue</h3>
          <button className="issue-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="issue-error">{error}</div>}

        <label className="issue-label">Title</label>
        <input
          className="issue-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bug: repo not loading..."
        />

        <label className="issue-label">Description</label>
        <textarea
          className="issue-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain the issue clearly..."
        />

        <div className="issue-modal-actions">
          <button className="btn ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button
            className="btn primary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Issue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateIssueModal;