import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import api from "../../api/axios";
import "./profile.css";

const UserPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const myId = localStorage.getItem("userId");

  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("repos");
  const [loading, setLoading] = useState(true);
  const [followersModal, setFollowersModal] = useState(null); // "followers" | "following" | null
  const [modalUsers, setModalUsers] = useState([]);

  useEffect(() => {
    if (id === myId) { navigate("/profile", { replace: true }); return; }
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data: userData } = await api.get(`/userProfile/${id}`);
      setUser(userData);

      const myData = await api.get("/userProfile/me");
      const myFollowing = (myData.data.followedUsers || []).map(String);
      setFollowing(myFollowing.includes(id));

      // fetch public repos owned by this user
      const { data: allRepos } = await api.get("/repo/all");
      setRepos(allRepos.filter((r) => r.owner?._id === id || r.owner === id));
    } catch (err) {
      console.error("Public profile load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    try {
      const { data } = await api.post(`/follow/${id}`);
      setFollowing(data.following);
      setUser((prev) => {
        const followers = prev.followers || [];
        if (data.following) {
          return { ...prev, followers: [...followers, myId] };
        } else {
          return { ...prev, followers: followers.filter((f) => f.toString() !== myId) };
        }
      });
    } catch (err) {
      console.error("Follow toggle failed:", err);
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
        <button className={activeTab === "repos" ? "active" : ""} onClick={() => setActiveTab("repos")}>
          Repositories
        </button>
        <button className={activeTab === "starred" ? "active" : ""} onClick={() => setActiveTab("starred")}>
          Starred
        </button>
      </div>

      <section className="profile-page-wrapper">
        <aside className="user-profile-section">
          <div className="profile-card">
            <div className="profile-image">{user.username?.[0]?.toUpperCase()}</div>
            <h3>{user.username}</h3>
            {user.bio && <p className="bio">{user.bio}</p>}

            <button className={`follow-btn ${following ? "following" : ""}`} onClick={toggleFollow}>
              {following ? "Unfollow" : "Follow"}
            </button>

            <div className="stats">
              <span className="stat-link" onClick={() => openModal("followers")}>
                <strong>{(user.followers || []).length}</strong> Followers
              </span>
              <span className="stat-link" onClick={() => openModal("following")}>
                <strong>{(user.followedUsers || []).length}</strong> Following
              </span>
            </div>

            <div className="user-meta">
              <p>📅 Joined {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>
            </div>
          </div>
        </aside>

        <main className="profile-content">
          {activeTab === "repos" && (
            <div className="card">
              {repos.length === 0 ? (
                <p className="muted">No public repositories.</p>
              ) : (
                <div className="repo-grid">
                  {repos.map((repo) => (
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
              <p className="muted">Starred repos are private to the user.</p>
            </div>
          )}
        </main>
      </section>

      {followersModal && (
        <div className="modal-overlay" onClick={() => setFollowersModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{followersModal === "followers" ? "Followers" : "Following"}</h3>
              <button className="modal-close" onClick={() => setFollowersModal(null)}>✕</button>
            </div>
            {modalUsers.length === 0 ? (
              <p className="muted">No users here yet.</p>
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

export default UserPublicProfile;
