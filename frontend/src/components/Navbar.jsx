import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./navbar.css";
import logo from "../assets/forjeX-fox.png";
import { useAuth } from "../authContext";
import api from "../api/axios";

const Navbar = ({ allRepos = [] }) => {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const isProfilePage = location.pathname === "/profile";

  const repoResults =
    query.trim().length > 0
      ? allRepos.filter((repo) =>
          `${repo.name} ${repo.description}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      : [];

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 1) {
      try {
        const { data } = await api.get("/allUsers");
        setUserResults(
          data.filter((u) => u.username?.toLowerCase().includes(val.toLowerCase())).slice(0, 4)
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
          <Link to="/" className="nav-item active">Build</Link>
          <Link to="/collaborate" className="nav-item">Collaborate</Link>
          <Link to="/learn" className="nav-item">Learn</Link>
          <Link to="/discover" className="nav-item">Discover</Link>
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
                onClick={() => { setQuery(""); navigate(`/repo/${repo._id}`); }}
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
                onClick={() => { setQuery(""); setUserResults([]); navigate(`/user/${u._id}`); }}
              >
                <span className="search-icon search-user-icon">{u.username?.[0]?.toUpperCase()}</span>
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





