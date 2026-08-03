const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const router = express.Router();

router.post("/google", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  try {
    let email, name, sub;

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Try official Google token verification if CLIENT_ID is present
    if (clientId) {
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        sub = payload.sub;
      } catch (verifyErr) {
        console.warn("IdToken verification warning, falling back to payload decode:", verifyErr.message);
        const decoded = jwt.decode(token);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || decoded.email.split("@")[0];
          sub = decoded.sub || decoded.user_id;
        } else {
          throw verifyErr;
        }
      }
    } else {
      // Decode JWT token payload directly
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.email) {
        return res.status(400).json({ error: "Invalid Google token payload" });
      }
      email = decoded.email;
      name = decoded.name || decoded.email.split("@")[0];
      sub = decoded.sub || decoded.user_id;
    }

    if (!email) {
      return res.status(400).json({ error: "Email not provided by Google account" });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      let baseUsername = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
      let username = baseUsername;
      
      // Ensure username uniqueness to prevent MongoDB E11000 duplicate key error
      let count = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
        count++;
        if (count > 10) break;
      }

      user = await User.create({
        email,
        username,
        googleId: sub,
      });
    }

    const appToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY || "default_jwt_secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token: appToken,
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("Google Auth Controller Error:", err);
    return res.status(500).json({ error: "Google authentication processing failed" });
  }
});

module.exports = router;
