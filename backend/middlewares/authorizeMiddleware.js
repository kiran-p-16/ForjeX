const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");

const authorizeSelf = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  if (req.userId !== req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

const authorizeRepoIssue = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const id = req.params.id;

  const repo = await Repository.findById(id);
  if (repo) {
    if (repo.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  }

  const issue = await Issue.findById(id).populate("repository");
  if (!issue || issue.repository.owner.toString() !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

module.exports = {
  authorizeSelf,
  authorizeRepoIssue
};
