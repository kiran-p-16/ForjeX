const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createIssue(req, res) {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Issue title is required" });
    }

    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const issue = new Issue({
      title: title.trim(),
      description: description?.trim() || "",
      repository: id,
      status: "open",
      createdBy: req.userId,
    });

    await issue.save();

    repo.issues.push(issue._id);
    await repo.save();

    res.status(201).json(issue);
  } catch (err) {
    console.error("Error during issue creation:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;

    if (status !== undefined) {
      const allowed = ["open", "closed"];

      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Allowed: ${allowed.join(", ")}`,
        });
      }

      issue.status = status;
    }

    await issue.save();

    res.json({
      message: "Issue updated",
      issue,
    });
  } catch (err) {
    console.error("Error during issue updation:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function deleteIssueById(req, res) {
  const { id } = req.params;

  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    await Repository.findByIdAndUpdate(issue.repository, {
      $pull: { issues: issue._id },
    });

    await Issue.findByIdAndDelete(id);

    res.json({ message: "Issue deleted" });
  } catch (err) {
    console.error("Error during issue deletion:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getAllIssues(req, res) {
  const { id } = req.params;

  try {
    const issues = await Issue.find({ repository: id }).sort({ createdAt: -1 });

    res.status(200).json(issues); 
  } catch (err) {
    console.error("Error during issue fetching:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;
  try {
    const issue = await Issue.findById(id)
      .populate("createdBy", "username")
      .populate("comments.author", "username");

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    res.json(issue);
  } catch (err) {
    console.error("Error during issue fetch:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

async function addComment(req, res) {
  const { id } = req.params;
  const { body } = req.body;

  try {
    if (!body || body.trim().length === 0) {
      return res.status(400).json({ error: "Comment body is required" });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    issue.comments.push({
      body: body.trim(),
      author: req.userId,
    });

    await issue.save();

    // Return the populated issue so frontend gets author info
    const populated = await Issue.findById(id).populate("comments.author", "username");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function deleteComment(req, res) {
  const { id, commentId } = req.params;

  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    const comment = issue.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found!" });
    }

    // Only the comment author or repo owner can delete
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    comment.deleteOne();
    await issue.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
  addComment,
  deleteComment,
};