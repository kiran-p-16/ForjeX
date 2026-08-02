import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import API from "../../api/axios";
import CreateIssueModal from "./CreateIssueModal";
import "./issue.css";

const IssuesList = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repo, setRepo] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  const userId = localStorage.getItem("userId");

  const isOwner = useMemo(() => {
    return repo?.owner?._id === userId;
  }, [repo, userId]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const repoRes = await API.get(`/repo/${id}`);
      setRepo(repoRes.data);

      const issuesRes = await API.get(`/issue/all/${id}`);
      setIssues(issuesRes.data || []);
    } catch (err) {
      console.error("ISSUES FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const filteredIssues = useMemo(() => {
    if (filter === "open") return issues.filter((i) => i.status === "open");
    if (filter === "closed") return issues.filter((i) => i.status === "closed");
    return issues;
  }, [issues, filter]);

  if (loading || !repo) return null;

  return (
    <>
      <Navbar />

      <section className="issues-wrapper">
        <div className="issues-header">
          <div>
            <h2 className="issues-title">{repo.name} / Issues</h2>
            <p className="issues-subtitle">
              Report bugs, request features, and track tasks.
            </p>
          </div>

          <div className="issues-header-actions">
            <button className="btn ghost" onClick={() => navigate(`/repo/${id}`)}>
              Back to repo
            </button>

            <button className="btn primary" onClick={() => setShowCreate(true)}>
              + New Issue
            </button>
          </div>
        </div>

        <div className="issues-toolbar">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`filter-btn ${filter === "open" ? "active" : ""}`}
            onClick={() => setFilter("open")}
          >
            Open
          </button>

          <button
            className={`filter-btn ${filter === "closed" ? "active" : ""}`}
            onClick={() => setFilter("closed")}
          >
            Closed
          </button>
        </div>

        <div className="issues-panel">
          {filteredIssues.length === 0 ? (
            <p className="muted">No issues found.</p>
          ) : (
            <div className="issues-list">
              {filteredIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="issue-row"
                  onClick={() => navigate(`/repo/${id}/issues/${issue._id}`)}
                >
                  <div className="issue-row-left">
                    <span
                      className={`issue-status ${
                        issue.status === "open" ? "open" : "closed"
                      }`}
                    >
                      {issue.status === "open" ? "● Open" : "● Closed"}
                    </span>

                    <span className="issue-title">{issue.title}</span>
                  </div>

                  <span className="issue-date">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isOwner && (
            <p className="issues-note">
              You can create issues, but only the repo owner can close/delete.
            </p>
          )}
        </div>
      </section>

      {showCreate && (
        <CreateIssueModal
          repoId={id}
          onClose={() => setShowCreate(false)}
          onCreated={() => fetchAll()}
        />
      )}
    </>
  );
};

export default IssuesList;