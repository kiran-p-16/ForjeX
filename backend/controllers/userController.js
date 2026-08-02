const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

async function signup(req, res) {
  const { username, password, email } = req.body;

  try {
    if (!username || !password || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      const field = existingUser.username === username ? "Username" : "Email";
      return res.status(400).json({ message: `${field} already exists!` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, userId: newUser._id });
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Please login with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find({}, "-password").lean();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id, "-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateUserProfile(req, res) {
  const { email, password, bio } = req.body;

  try {
    const updateFields = {};
    if (email) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "Profile updated successfully!", user });
  } catch (err) {
    console.error("Error updating profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteUserProfile(req, res) {
  try {
    const result = await User.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User profile deleted!" });
  } catch (err) {
    console.error("Error deleting profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId, "-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("GET ME ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

async function followUser(req, res) {
  const targetId = req.params.id;
  const currentId = req.userId;

  if (targetId === currentId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const [current, target] = await Promise.all([
      User.findById(currentId),
      User.findById(targetId),
    ]);

    if (!current || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = current.followedUsers.some(
      (id) => id.toString() === targetId
    );

    if (alreadyFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(currentId, {
          $pull: { followedUsers: targetId },
        }),
        User.findByIdAndUpdate(targetId, {
          $pull: { followers: currentId },
        }),
      ]);
      return res.json({ following: false });
    } else {
      await Promise.all([
        User.findByIdAndUpdate(currentId, {
          $addToSet: { followedUsers: targetId },
        }),
        User.findByIdAndUpdate(targetId, {
          $addToSet: { followers: currentId },
        }),
      ]);

      const { sendNotification } = require("./notificationController");
      sendNotification(req.app, {
        recipient: targetId,
        sender: currentId,
        type: "follow",
        message: `${current.username} started following you.`,
      });

      return res.json({ following: true });
    }
  } catch (err) {
    console.error("Follow error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getPublicProfile(req, res) {
  try {
    const user = await User.findById(req.params.id, "-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Public profile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getMe,
  followUser,
  getPublicProfile,
};