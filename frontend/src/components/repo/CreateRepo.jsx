import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import api from "../../api/axios";
import "./createRepo.css";

const CreateRepo = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Repository name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/repo/create", {
        name,
        description,
        visibility,
      });

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to create repository"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <section className="create-wrapper">
        <div className="create-card">
          <h2>Create a new repository</h2>
          <p className="subtitle">
            A repository contains all project files and revision history.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Repository name</label>
            <input
              type="text"
              placeholder="my-awesome-project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label>Description (optional)</label>
            <textarea
              placeholder="Short description of your project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="visibility">
              <label>
                <input
                  type="radio"
                  checked={visibility === true}
                  onChange={() => setVisibility(true)}
                />
                <strong>Public</strong>
                <span>Anyone can see this repository</span>
              </label>

              <label>
                <input
                  type="radio"
                  checked={visibility === false}
                  onChange={() => setVisibility(false)}
                />
                <strong>Private</strong>
                <span>Only you can see this repository</span>
              </label>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create repository"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default CreateRepo;
