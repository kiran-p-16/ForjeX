import React, { useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../authContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Button } from "@primer/react";
import { GoogleLogin } from "@react-oauth/google";

import "./auth.css";
import logo from "../../assets/forjeX-fox.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await api.post("/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      setCurrentUser(res.data.userId);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Invalid email or password.");
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
      setError("Google login failed. Please try again.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box-wrapper">
        <div className="login-logo-container">
          <img src={logo} alt="ForjeX Logo" className="logo-login" />
        </div>

        <div className="login-box">
          <h1 className="auth-title">Sign in to ForjeX</h1>
          <p className="auth-subtitle">
            Build, version, and collaborate on code
          </p>

          <form onSubmit={handleLogin}>
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
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </div>

        <div className="pass-box">
          New to ForjeX?{" "}
          <RouterLink to="/signup">Create an account</RouterLink>
        </div>
      </div>
    </div>
  );
};

export default Login;
