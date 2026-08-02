const express = require("express");
const userRouter = require("./user.router");
const repoRouter = require("./repo.router");
const issueRouter = require("./issue.router");
const googleAuthRouter = require("./googleAuth.router");
const aiRouter = require("./ai.router");
const notificationRouter = require("./notification.router");

const mainRouter = express.Router();

mainRouter.use(userRouter);
mainRouter.use(repoRouter);
mainRouter.use(issueRouter);
mainRouter.use(aiRouter);
mainRouter.use(notificationRouter);
mainRouter.use("/auth", googleAuthRouter);

mainRouter.get("/", (req, res) => {
  res.send("Welcome!");
});

module.exports = mainRouter;