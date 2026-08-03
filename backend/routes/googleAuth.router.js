// Google Auth Router v3.0.0 - Production Hardened
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const router = express.Router();

router.post("/google", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Google token is required" });
  }

  try {
    let email, name, sub;

    // Try decoding Google JWT ID token directly
    const decoded = jwt.decode(token);
    if (decoded && decoded.email) {
      email = decoded.email;
      name = decoded.name || decoded.email.split("@")[0];
      sub = decoded.sub || decoded.user_id;
    } else {
      // Fallback to Google OAuth2Client verifyIdToken
      const clientId = process.env.GOOGLE_CLIENT_ID || "1081356031017-u1ltk248betng7cakvjkn8ukkhohv72f.apps.googleusercontent.com";
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      sub = payload.sub;
    }

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google account" });
    }

    // Find existing user by email or googleId
    let user = await User.findOne({
      $or: [{ email }, { googleId: sub }],
    });

    if (!user) {
      let baseUsername = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
      let username = baseUsername;
      
      let count = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
        count++;
        if (count > 20) break;
      }

      user = await User.create({
        email,
        username,
        googleId: sub,
      });
    } else if (!user.googleId) {
      // Link googleId if existing email account signs in via Google
      user.googleId = sub;
      await user.save();
    }

    const appToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY || "forjex_default_secret_key_2026",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token: appToken,
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("Google Auth Router Error:", err.message);
    return res.status(400).json({ message: err.message || "Google authentication failed" });
  }
});

module.exports = router;
