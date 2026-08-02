const express = require("express");
const repoController = require("../controllers/repoController");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRepoIssue } = require("../middlewares/authorizeMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const repoRouter = express.Router();

repoRouter.post("/repo/create", authMiddleware, repoController.createRepository);

repoRouter.get("/repo/all", repoController.getAllRepositories);

repoRouter.get("/repo/search", repoController.searchRepositories);

repoRouter.get(
  "/repo/user/me",
  authMiddleware,
  repoController.fetchRepositoriesForCurrentUser
);

repoRouter.get("/repo/:id/file", authMiddleware, repoController.getRepoFile);

repoRouter.get(
  "/repo/:id/download",
  authMiddleware,
  repoController.downloadRepoFile
);

repoRouter.put("/repo/:id/file", authMiddleware, repoController.updateRepoFile);

repoRouter.delete(
  "/repo/:id/file",
  authMiddleware,
  authorizeRepoIssue,
  repoController.deleteFileFromRepo
);

repoRouter.post(
  "/repo/:id/upload",
  authMiddleware,
  upload.any(),
  repoController.uploadFilesToRepo
);

repoRouter.post("/repo/:id/star", authMiddleware, repoController.toggleStarRepository);

repoRouter.put(
  "/repo/update/:id",
  authMiddleware,
  authorizeRepoIssue,
  repoController.updateRepositoryById
);

repoRouter.patch(
  "/repo/toggle/:id",
  authMiddleware,
  authorizeRepoIssue,
  repoController.toggleVisibilityById
);

repoRouter.delete(
  "/repo/delete/:id",
  authMiddleware,
  authorizeRepoIssue,
  repoController.deleteRepositoryById
);

repoRouter.get("/repo/:id", authMiddleware, repoController.fetchRepositoryById);

module.exports = repoRouter;