import React, { useEffect, useState } from "react";
import "./dashboard.css";
import Navbar from "../Navbar";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const [userRepos, setUserRepos] = useState([]);
  const [suggestedRepos, setSuggestedRepos] = useState([]);
  const [starredIds, setStarredIds] = useState(new Set());
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profile } = await api.get("/userProfile/me");

        setUsername(profile.username || "you");
        setStarredIds(new Set((profile.starRepos || []).map(String)));

        const { data: myRepos } = await api.get("/repo/user/me");
        const safeMyRepos = Array.isArray(myRepos) ? myRepos : [];
        setUserRepos(safeMyRepos);

        const myRepoIds = new Set(safeMyRepos.map((r) => r._id));

        const { data: allRepos } = await api.get("/repo/all");
        const safeAll = Array.isArray(allRepos) ? allRepos : [];

        setSuggestedRepos(
          safeAll.filter((repo) => !myRepoIds.has(repo._id))
        );
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setUserRepos([]);
        setSuggestedRepos([]);
      }
    };

    fetchData();
  }, []);

  const toggleStar = async (repoId) => {
    try {
      const { data } = await api.post(`/repo/${repoId}/star`);

      setStarredIds((prev) => {
        const updated = new Set(prev);
        data.starred ? updated.add(repoId) : updated.delete(repoId);
        return updated;
      });

      setUserRepos((prev) =>
        prev.map((repo) =>
          repo._id === repoId ? { ...repo, stars: data.stars } : repo
        )
      );

      setSuggestedRepos((prev) =>
        prev.map((repo) =>
          repo._id === repoId ? { ...repo, stars: data.stars } : repo
        )
      );
    } catch (err) {
      console.error("Star toggle failed:", err);
    }
  };

  return (
    <>
      <Navbar allRepos={[...userRepos, ...suggestedRepos]} />

      <section id="dashboard">
        {/* ===== SUGGESTED ===== */}
        <aside className="panel suggested-panel">
          <h3>Suggested for you</h3>

          {suggestedRepos.length === 0 ? (
            <p className="muted">No suggestions right now.</p>
          ) : (
            suggestedRepos.map((repo) => (
              <div key={repo._id} className="repo-card suggested-card">
                <Link to={`/repo/${repo._id}`} className="repo-link">
                  <div>
                    <h4>{repo.name}</h4>
                    <p>{repo.description}</p>
                    <span className="owner">
                      by{" "}
                      <span
                        className="owner-link"
                        onClick={(e) => { e.preventDefault(); navigate(`/user/${repo.owner?._id}`); }}
                      >
                        {repo.owner?.username || "unknown"}
                      </span>
                    </span>
                  </div>
                </Link>

                <button
                  className={`star-btn ${
                    starredIds.has(repo._id) ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(repo._id);
                  }}
                >
                  ★
                </button>
              </div>
            ))
          )}
        </aside>

        {/* ===== YOUR REPOS ===== */}
        <main className="panel main-panel">
          <h2>Your repositories</h2>

          {userRepos.length === 0 ? (
            <div className="empty-state">
              <h3>No repositories yet</h3>
              <p>Create your first repository to start building.</p>
              <Link to="/create" className="create-btn">
                + Create Repository
              </Link>
            </div>
          ) : (
            <div className="repo-grid">
              {userRepos.map((repo) => (
                <div
                  key={repo._id}
                  className="repo-card"
                  onClick={() => navigate(`/repo/${repo._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="repo-header">
                    <h4>{repo.name}</h4>

                    <button
                      className={`star-btn ${
                        starredIds.has(repo._id) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(repo._id);
                      }}
                    >
                      ★
                    </button>
                  </div>

                  <p className="repo-desc">{repo.description}</p>
                  <span className="owner">by {username}</span>

                  <div className="repo-footer">
                    <span className="meta">⭐ {repo.stars}</span>
                    <span
                      className={`badge ${
                        repo.visibility ? "public" : "private"
                      }`}
                    >
                      {repo.visibility ? "Public" : "Private"}
                    </span>
                    <span className="meta">
                      Updated{" "}
                      {new Date(repo.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ===== ACTIVITY ===== */}
        <aside className="panel activity-panel">
          <h3>Activity</h3>
          <ul className="activity-list">
            <li>⭐ Star repositories to support projects</li>
            <li>📦 Create repositories to build products</li>
            <li>🔒 Control repository visibility</li>
          </ul>
          <button className="activity-btn">View all activity</button>
        </aside>
      </section>
    </>
  );
};

export default Dashboard;
