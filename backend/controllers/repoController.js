const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");

async function createRepository(req, res) {
  const { name, description, visibility } = req.body;
  const owner = req.userId;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    const repo = await Repository.create({
      name,
      description,
      visibility: visibility ?? true,
      owner,
      content: [],
      issues: [],
    });

    res.status(201).json(repo);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "You already have a repository with this name" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

async function getAllRepositories(req, res) {
  try {
    const repos = await Repository.find({ visibility: true })
      .populate("owner", "username")
      .sort({ createdAt: -1 });

    res.json(repos);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    const repo = await Repository.findById(id)
      .populate("owner", "username")
      .populate("issues");

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (!repo.visibility && repo.owner._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Private repository" });
    }

    res.json(repo);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

async function searchRepositories(req, res) {
  const { q } = req.query;

  try {
    const repos = await Repository.find({
      visibility: true,
      name: { $regex: q || "", $options: "i" },
    }).populate("owner", "username");

    res.json(repos);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  try {
    const repos = await Repository.find({ owner: req.userId })
      .sort({ updatedAt: -1 });

    res.json(repos);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { description, visibility } = req.body;

  try {
    const repo = await Repository.findById(id);

    if (!repo) return res.status(404).json({ error: "Repository not found" });
    if (repo.owner.toString() !== req.userId)
      return res.status(403).json({ error: "Forbidden" });

    if (description !== undefined) repo.description = description;
    if (visibility !== undefined) repo.visibility = visibility;

    await repo.save();
    res.json(repo);
  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function toggleVisibilityById(req, res) {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (repo.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    repo.visibility = !repo.visibility;
    await repo.save();

    res.json(repo);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

async function toggleStarRepository(req, res) {
  try {
    const userId = req.userId;
    const repoId = req.params.id;

    const user = await User.findById(userId);
    const repo = await Repository.findById(repoId);

    if (!user || !repo) {
      return res.status(404).json({ error: "Not found" });
    }

    if (!repo.visibility && repo.owner.toString() !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const index = user.starRepos.findIndex(
      (id) => id.toString() === repoId
    );

    let starred;

    if (index === -1) {
      user.starRepos.push(repoId);
      repo.stars += 1;
      starred = true;
    } else {
      user.starRepos.splice(index, 1);
      repo.stars = Math.max(repo.stars - 1, 0);
      starred = false;
    }

    await user.save();
    await repo.save();

    if (starred && repo.owner.toString() !== userId) {
      const { sendNotification } = require("./notificationController");
      sendNotification(req.app, {
        recipient: repo.owner,
        sender: userId,
        type: "star",
        repository: repo._id,
        message: `${user.username} starred your repository ${repo.name}.`,
      });
    }

    res.json({ starred, stars: repo.stars });
  } catch (err) {
    console.error("STAR ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

async function uploadFilesToRepo(req, res) {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo || repo.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const paths = Array.isArray(req.body.paths)
      ? req.body.paths
      : req.body.paths
      ? [req.body.paths]
      : [];

    const repoRoot = path.join(process.cwd(), "uploads", req.params.id);

    const filePaths = req.files.map((file, index) => {
      const relPath = (paths[index] || file.originalname).replace(/\\/g, "/");

      const targetPath = path.join(repoRoot, relPath);
      const targetDir = path.dirname(targetPath);

      // create folder structure
      fs.mkdirSync(targetDir, { recursive: true });

      // move uploaded file into correct folder
      fs.renameSync(file.path, targetPath);

      return relPath;
    });

    repo.content.push(...filePaths);
    repo.content = [...new Set(repo.content)];

    await repo.save();

    res.json({ content: repo.content });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function deleteRepositoryById(req, res) {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (repo.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await repo.deleteOne();

    const repoUploadPath = path.join("uploads", req.params.id);
    if (fs.existsSync(repoUploadPath)) {
      fs.rmSync(repoUploadPath, { recursive: true, force: true });
    }

    res.json({ message: "Repository deleted" });
  } catch (err) {
    console.error("DELETE REPO ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function deleteFileFromRepo(req, res) {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (repo.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const filePath = req.body.filePath;

    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    repo.content = repo.content.filter((p) => p !== filePath);
    await repo.save();

    const fullPath = path.join("uploads", req.params.id, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ content: repo.content });
  } catch (err) {
    console.error("DELETE FILE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getRepoFile(req, res) {
  try {
    const repo = await Repository.findById(req.params.id).populate("owner", "username");

    if (!repo) return res.status(404).json({ error: "Repository not found" });

    if (!repo.visibility && repo.owner._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Private repository" });
    }

    const filePath = req.query.path;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ error: "File path is required" });
    }

    const cleanPath = filePath.replace(/\\/g, "/");

    const uploadsRoot = path.join(process.cwd(), "uploads", req.params.id);
    const absolutePath = path.join(uploadsRoot, cleanPath);

    if (!absolutePath.startsWith(uploadsRoot)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = fs.readFileSync(absolutePath, "utf-8");

    res.json({
      path: cleanPath,
      content,
    });
  } catch (err) {
    console.error("GET FILE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateRepoFile(req, res) {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo) return res.status(404).json({ error: "Repository not found" });

    if (repo.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { path: filePath, content } = req.body;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ error: "File path is required" });
    }

    if (typeof content !== "string") {
      return res.status(400).json({ error: "File content is required" });
    }

    const cleanPath = filePath.replace(/\\/g, "/");

    const uploadsRoot = path.join(process.cwd(), "uploads", req.params.id);
    const absolutePath = path.join(uploadsRoot, cleanPath);

    if (!absolutePath.startsWith(uploadsRoot)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    fs.writeFileSync(absolutePath, content, "utf-8");

    res.json({ message: "File updated" });
  } catch (err) {
    console.error("UPDATE FILE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function downloadRepoFile(req, res) {
  try {
    const repo = await Repository.findById(req.params.id).populate(
      "owner",
      "username"
    );

    if (!repo) return res.status(404).json({ error: "Repository not found" });

    if (!repo.visibility && repo.owner._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Private repository" });
    }

    const filePath = req.query.path;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ error: "File path is required" });
    }

    const cleanPath = filePath.replace(/\\/g, "/");

    const uploadsRoot = path.join(process.cwd(), "uploads", req.params.id);
    const absolutePath = path.join(uploadsRoot, cleanPath);

    if (!absolutePath.startsWith(uploadsRoot)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.download(absolutePath, path.basename(cleanPath));
  } catch (err) {
    console.error("DOWNLOAD FILE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  searchRepositories,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
  toggleStarRepository,
  uploadFilesToRepo,
  deleteFileFromRepo,
  getRepoFile,
  updateRepoFile,
  downloadRepoFile,
};
