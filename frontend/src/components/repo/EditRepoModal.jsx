import React, { useState } from "react";
import API from "../../api/axios";
import "./repository.css";

const EditRepoModal = ({ repo, onClose, onUpdated }) => {
  const [description, setDescription] = useState(repo.description || "");
  const [visibility, setVisibility] = useState(repo.visibility ?? true);
  const [saving, setSaving] = useState(false);

  const saveChanges = async () => {
    try {
      setSaving(true);

      await API.put(`/repo/update/${repo._id}`, {
        description,
        visibility,
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update repository", err);
      alert("Failed to update repository");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-dark" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Repository</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Name</label>
            <input value={repo.name} disabled />
          </div>

          <div className="modal-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description…"
            />
          </div>

          <div className="modal-field">
            <label>Visibility</label>

            <div className="visibility-toggle">
              <button
                className={`vis-btn ${visibility ? "active" : ""}`}
                onClick={() => setVisibility(true)}
                type="button"
              >
                🌍 Public
              </button>

              <button
                className={`vis-btn ${!visibility ? "active" : ""}`}
                onClick={() => setVisibility(false)}
                type="button"
              >
                🔒 Private
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>

          <button
            className="btn primary"
            onClick={saveChanges}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRepoModal;