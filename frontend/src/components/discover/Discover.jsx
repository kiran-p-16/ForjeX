import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import api from "../../api/axios";
import "./discover.css";

const Discover = () => {
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeLanguage, setActiveLanguage] = useState("all");

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setLoading(true);
      const [repoRes, userRes] = await Promise.all([
        api.get("/repo/all"),
        api.get("/allUsers"),
      ]);

      setRepos(Array.isArray(repoRes.data) ? repoRes.data : []);
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
    } catch (err) {
      console.error("Discover load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesLang =
      activeLanguage === "all" ||
      r.language?.toLowerCase() === activeLanguage.toLowerCase();
    return matchesSearch && matchesLang;
  });

  return (
    <>
      <Navbar allRepos={repos} />

      <div className="discover-page-wrapper">
        <header className="discover-header">
          <h2>🧭 Discover Projects & Developers</h2>
          <p>Explore public code repositories, trending tech stacks, and developers on forjeX.</p>
        </header>

        {/* Filters & Search */}
        <div className="discover-controls">
          <input
            type="text"
            className="discover-search-input"
            placeholder="Search open source projects by topic, name, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="lang-filter-group">
            {["all", "javascript", "typescript", "python", "html", "css", "cpp"].map(
              (lang) => (
                <button
                  key={lang}
                  className={`lang-chip ${activeLanguage === lang ? "active" : ""}`}
                  onClick={() => setActiveLanguage(lang)}
                >
                  {lang === "all" ? "🌐 All Languages" : lang}
                </button>
              )
            )}
          </div>
        </div>

        <div className="discover-grid-layout">
          {/* Main Repos Grid */}
          <main className="discover-main">
            <h3>Trending Repositories ({filteredRepos.length})</h3>

            {loading ? (
              <div className="discover-loading">Loading projects…</div>
            ) : filteredRepos.length === 0 ? (
              <p className="muted">No repositories found matching your filter.</p>
            ) : (
              <div className="discover-repo-grid">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo._id}
                    className="discover-repo-card"
                    onClick={() => navigate(`/repo/${repo._id}`)}
                  >
                    <div className="card-top">
                      <h4>📦 {repo.name}</h4>
                      <span className="star-badge">⭐ {repo.stars}</span>
                    </div>

                    <p className="repo-desc">{repo.description || "No description provided."}</p>

                    <div className="card-bottom">
                      <span className="owner">by @{repo.owner?.username || "developer"}</span>
                      {repo.language && (
                        <span className="lang-tag">{repo.language}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar Developers */}
          <aside className="discover-sidebar">
            <h3>Popular Developers</h3>
            <div className="dev-list">
              {users.slice(0, 6).map((u) => (
                <div
                  key={u._id}
                  className="dev-card"
                  onClick={() => navigate(`/user/${u._id}`)}
                >
                  <div className="dev-avatar">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="dev-info">
                    <strong>{u.username}</strong>
                    <span className="dev-meta">
                      {(u.followers || []).length} followers
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Discover;
