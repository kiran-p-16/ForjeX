import React, { useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../authContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Button } from "@primer/react";
import { GoogleLogin } from "@react-oauth/google";

import "./auth.css";
import logo from "../../assets/forjeX-fox.png";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !username || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/signup", {
        email,
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      setCurrentUser(res.data.userId);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      setCurrentUser(res.data.userId);
      navigate("/");
    } catch {
      setError("Google signup failed. Please try again.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box-wrapper">
        <div className="login-logo-container">
          <img src={logo} alt="ForjeX Logo" className="logo-login" />
        </div>

        <div className="login-box">
          <h1 className="auth-title">Sign up to ForjeX</h1>
          <p className="auth-subtitle">
            Build, version, and collaborate on code
          </p>

          <form onSubmit={handleSignup}>
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <Button
              type="submit"
              className="login-btn"
              variant="primary"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google signup failed")}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </div>

        <div className="pass-box">
          Already have an account?{" "}
          <RouterLink to="/auth">Sign in</RouterLink>
        </div>
      </div>
    </div>
  );
};

export default Signup;
