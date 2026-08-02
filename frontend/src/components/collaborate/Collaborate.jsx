import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import api from "../../api/axios";
import "./collaborate.css";

const Collaborate = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLabel, setFilterLabel] = useState("all");

  useEffect(() => {
    fetchCollaborateIssues();
  }, []);

  const fetchCollaborateIssues = async () => {
    try {
      setLoading(true);
      const { data: repos } = await api.get("/repo/all");
      const allIssues = [];

      if (Array.isArray(repos)) {
        for (const r of repos.slice(0, 10)) {
          try {
            const { data: repoIssues } = await api.get(`/issue/all/${r._id}`);
            if (Array.isArray(repoIssues)) {
              repoIssues.forEach((i) => {
                allIssues.push({
                  ...i,
                  repoName: r.name,
                  repoId: r._id,
                });
              });
            }
          } catch (e) {}
        }
      }

      setIssues(allIssues);
    } catch (err) {
      console.error("Collaborate load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = issues.filter((i) => {
    if (filterLabel === "all") return i.status === "open";
    return (
      i.status === "open" &&
      i.labels?.some((l) => l.toLowerCase() === filterLabel.toLowerCase())
    );
  });

  return (
    <>
      <Navbar />

      <div className="collaborate-page-wrapper">
        <header className="collaborate-header">
          <h2>🤝 Community Collaboration Hub</h2>
          <p>Find open issues across forjeX projects and contribute to open source software.</p>
        </header>

        <div className="label-filter-bar">
          {["all", "bug", "help-wanted", "good-first-issue", "security", "enhancement"].map(
            (label) => (
              <button
                key={label}
                className={`label-chip ${filterLabel === label ? "active" : ""}`}
                onClick={() => setFilterLabel(label)}
              >
                {label === "all" ? "🔥 All Open Issues" : `🏷️ ${label}`}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="collaborate-loading">Loading community issues…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-collaborate">
            <p className="muted">No open issues found for this category.</p>
          </div>
        ) : (
          <div className="collaborate-issue-list">
            {filtered.map((issue) => (
              <div
                key={issue._id}
                className="collaborate-issue-card"
                onClick={() => navigate(`/repo/${issue.repoId}/issues/${issue._id}`)}
              >
                <div className="issue-card-top">
                  <h4>{issue.title}</h4>
                  <span className="repo-pill">📦 {issue.repoName}</span>
                </div>

                <p className="issue-desc">
                  {issue.description?.length > 150
                    ? `${issue.description.slice(0, 150)}…`
                    : issue.description}
                </p>

                <div className="issue-card-bottom">
                  <div className="label-group">
                    {issue.labels?.map((l, idx) => (
                      <span key={idx} className="issue-label">
                        {l}
                      </span>
                    ))}
                  </div>
                  <span className="issue-date">
                    Opened {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Collaborate;
