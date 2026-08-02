import React, { useEffect, useState } from "react";
import "./profile.css";
import Navbar from "../Navbar";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const Profile = () => {
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const myId = localStorage.getItem("userId");

  const [user, setUser] = useState(null);
  const [starredRepos, setStarredRepos] = useState([]);
  const [myRepos, setMyRepos] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", email: "", password: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // followers/following modal
  const [followersModal, setFollowersModal] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: userData } = await api.get("/userProfile/me");
      setUser(userData);
      setEditForm({ bio: userData.bio || "", email: userData.email || "", password: "" });

      const { data: repos } = await api.get("/repo/user/me");
      setMyRepos(Array.isArray(repos) ? repos : []);

      const starredIds = userData.starRepos || [];
      if (starredIds.length > 0) {
        const responses = await Promise.all(starredIds.map((id) => api.get(`/repo/${id}`)));
        setStarredRepos(responses.map((r) => r.data));
      } else {
        setStarredRepos([]);
      }
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setEditSaving(true);
    setEditError("");
    try {
      const payload = {};
      if (editForm.bio !== undefined) payload.bio = editForm.bio;
      if (editForm.email) payload.email = editForm.email;
      if (editForm.password) payload.password = editForm.password;

      await api.put(`/updateProfile/${myId}`, payload);
      setShowEdit(false);
      fetchProfile();
    } catch (err) {
      setEditError(err.response?.data?.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const openModal = async (type) => {
    const ids = type === "followers"
      ? (user.followers || [])
      : (user.followedUsers || []);
    try {
      const results = await Promise.all(ids.map((uid) => api.get(`/userProfile/${uid}`)));
      setModalUsers(results.map((r) => r.data));
      setFollowersModal(type);
    } catch (err) {
      console.error("Modal load failed:", err);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Navbar />

      <div className="profile-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={activeTab === "repos" ? "active" : ""} onClick={() => setActiveTab("repos")}>
          Repositories <span className="tab-count">{myRepos.length}</span>
        </button>
        <button className={activeTab === "starred" ? "active" : ""} onClick={() => setActiveTab("starred")}>
          Starred <span className="tab-count">{starredRepos.length}</span>
        </button>
      </div>

      <section className="profile-page-wrapper">
        <aside className="user-profile-section">
          <div className="profile-card">
            <div className="profile-image">{user.username?.[0]?.toUpperCase()}</div>
            <h3>{user.username}</h3>
            {user.bio && <p className="bio">{user.bio}</p>}

            <button className="edit-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>

            <div className="stats">
              <span className="stat-link" onClick={() => openModal("followers")}>
                <strong>{(user.followers || []).length}</strong> Followers
              </span>
              <span className="stat-link" onClick={() => openModal("following")}>
                <strong>{(user.followedUsers || []).length}</strong> Following
              </span>
            </div>

            <div className="user-meta">
              {user.email && <p>📧 {user.email}</p>}
              <p>📅 Joined {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>
            </div>
          </div>
        </aside>

        <main className="profile-content">
          {activeTab === "overview" && (
            <>
              <div className="card">
                <HeatMapProfile repos={myRepos} starredRepos={starredRepos} />
              </div>
              <div className="card activity-card">
                <h4>Recent Activity</h4>
                <ul>
                  {myRepos.slice(0, 3).map((r) => (
                    <li key={r._id}>
                      📦 Created <Link to={`/repo/${r._id}`}>{r.name}</Link>
                      <span className="activity-date"> · {new Date(r.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                  {starredRepos.slice(0, 3).map((r) => (
                    <li key={r._id}>
                      ⭐ Starred <Link to={`/repo/${r._id}`}>{r.name}</Link>
                    </li>
                  ))}
                  {myRepos.length === 0 && starredRepos.length === 0 && (
                    <li className="muted">No activity yet.</li>
                  )}
                </ul>
              </div>
            </>
          )}

          {activeTab === "repos" && (
            <div className="card">
              {myRepos.length === 0 ? (
                <p className="muted">No repositories yet. <Link to="/create">Create one</Link>.</p>
              ) : (
                <div className="repo-grid">
                  {myRepos.map((repo) => (
                    <Link key={repo._id} to={`/repo/${repo._id}`} className="repo-link">
                      <div className="repo-card">
                        <h4>{repo.name}</h4>
                        <p>{repo.description}</p>
                        <div className="repo-footer">
                          <span>⭐ {repo.stars}</span>
                          <span className="badge">{repo.visibility ? "Public" : "Private"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "starred" && (
            <div className="card">
              {starredRepos.length === 0 ? (
                <p className="muted">You haven't starred any repositories yet.</p>
              ) : (
                <div className="repo-grid">
                  {starredRepos.map((repo) => (
                    <Link key={repo._id} to={`/repo/${repo._id}`} className="repo-link">
                      <div className="repo-card">
                        <h4>{repo.name}</h4>
                        <p>{repo.description}</p>
                        <div className="repo-footer">
                          <span>⭐ {repo.stars}</span>
                          <span className="badge">{repo.visibility ? "Public" : "Private"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </section>

      {/* ===== EDIT PROFILE MODAL ===== */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label>Bio</label>
              <textarea
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people a little about yourself"
              />
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
              <label>New Password <span className="muted">(leave blank to keep current)</span></label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
              />
              {editError && <p className="form-error">{editError}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn-save" onClick={saveProfile} disabled={editSaving}>
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOLLOWERS / FOLLOWING MODAL ===== */}
      {followersModal && (
        <div className="modal-overlay" onClick={() => setFollowersModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{followersModal === "followers" ? "Followers" : "Following"}</h3>
              <button className="modal-close" onClick={() => setFollowersModal(null)}>✕</button>
            </div>
            {modalUsers.length === 0 ? (
              <p className="muted" style={{ padding: "16px" }}>No users here yet.</p>
            ) : (
              <ul className="user-list">
                {modalUsers.map((u) => (
                  <li key={u._id} onClick={() => { setFollowersModal(null); navigate(`/user/${u._id}`); }}>
                    <div className="user-avatar">{u.username?.[0]?.toUpperCase()}</div>
                    <span>{u.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
