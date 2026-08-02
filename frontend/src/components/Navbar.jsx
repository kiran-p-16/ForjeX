import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./navbar.css";
import logo from "../assets/forjeX-fox.png";
import { useAuth } from "../authContext";
import api from "../api/axios";

const Navbar = ({ allRepos = [] }) => {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [fetchedRepos, setFetchedRepos] = useState([]);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const userId = localStorage.getItem("userId");

  const isProfilePage = location.pathname === "/profile";

  // Fetch notifications on mount & set up Socket.io listener
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000");
    socket.emit("joinRoom", userId);

    socket.on("newNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {}
  };

  const handleMarkAsRead = async () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (unreadCount > 0) {
      try {
        await api.put("/notifications/read");
        setUnreadCount(0);
      } catch (e) {}
    }
  };

  const pool = allRepos.length > 0 ? allRepos : fetchedRepos;

  const repoResults =
    query.trim().length > 0
      ? pool.filter((repo) =>
          `${repo.name} ${repo.description || ""}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      : [];

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length > 1) {
      try {
        if (allRepos.length === 0 && fetchedRepos.length === 0) {
          const { data } = await api.get("/repo/all");
          setFetchedRepos(Array.isArray(data) ? data : []);
        }

        const { data: userData } = await api.get("/allUsers");
        setUserResults(
          userData
            .filter((u) => u.username?.toLowerCase().includes(val.toLowerCase()))
            .slice(0, 4)
        );
      } catch {
        setUserResults([]);
      }
    } else {
      setUserResults([]);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    navigate("/auth");
  };

  const hasResults = repoResults.length > 0 || userResults.length > 0;

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <Link to="/" className="brand">
          <img src={logo} alt="forjeX logo" />
          <span>forjeX</span>
        </Link>

        <div className="primary-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          >
            Build
          </Link>
          <Link
            to="/collaborate"
            className={`nav-item ${
              location.pathname === "/collaborate" ? "active" : ""
            }`}
          >
            Collaborate
          </Link>
          <Link
            to="/discover"
            className={`nav-item ${
              location.pathname === "/discover" ? "active" : ""
            }`}
          >
            Discover
          </Link>
        </div>
      </div>

      {/* CENTER SEARCH */}
      <div className="nav-center">
        <input
          type="text"
          placeholder="Search repositories or users…"
          value={query}
          onChange={handleSearch}
        />

        {hasResults && (
          <div className="search-dropdown">
            {repoResults.slice(0, 5).map((repo) => (
              <div
                key={repo._id}
                className="search-item"
                onClick={() => {
                  setQuery("");
                  navigate(`/repo/${repo._id}`);
                }}
              >
                <span className="search-icon">📦</span>
                <div>
                  <strong>{repo.name}</strong>
                  <span>{repo.description}</span>
                </div>
              </div>
            ))}
            {userResults.map((u) => (
              <div
                key={u._id}
                className="search-item"
                onClick={() => {
                  setQuery("");
                  setUserResults([]);
                  navigate(`/user/${u._id}`);
                }}
              >
                <span className="search-icon search-user-icon">
                  {u.username?.[0]?.toUpperCase()}
                </span>
                <div>
                  <strong>{u.username}</strong>
                  <span>User</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {/* Notification Bell */}
        <div className="notif-wrapper">
          <button className="notif-bell-btn" onClick={handleMarkAsRead}>
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifDropdown && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">Notifications</div>
              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="notif-item">
                      <span className="notif-icon">
                        {n.type === "star"
                          ? "⭐"
                          : n.type === "follow"
                          ? "👤"
                          : n.type === "issue"
                          ? "🐞"
                          : "🔔"}
                      </span>
                      <div className="notif-text">
                        <p>{n.message}</p>
                        <span className="notif-time">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link to="/create">
          <button className="btn primary">+ New</button>
        </Link>

        {!isProfilePage ? (
          <Link to="/profile">
            <button className="btn ghost">Profile</button>
          </Link>
        ) : (
          <button className="btn ghost logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
