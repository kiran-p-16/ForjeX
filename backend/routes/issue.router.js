const express=require("express");
const issueController=require("../controllers/issueController");
const authMiddleware=require("../middlewares/authMiddleware");
const {authorizeRepoIssue}=require("../middlewares/authorizeMiddleware");

const issueRouter=express.Router();

issueRouter.post(
"/issue/create/:id",
authMiddleware,
authorizeRepoIssue,
issueController.createIssue
);

issueRouter.put(
"/issue/update/:id",
authMiddleware,
authorizeRepoIssue,
issueController.updateIssueById
);

issueRouter.delete(
"/issue/delete/:id",
authMiddleware,
authorizeRepoIssue,
issueController.deleteIssueById
);

issueRouter.get("/issue/all/:id",authMiddleware,issueController.getAllIssues);
issueRouter.get("/issue/:id",authMiddleware,issueController.getIssueById);

// Comments
issueRouter.post("/issue/:id/comment", authMiddleware, issueController.addComment);
issueRouter.delete("/issue/:id/comment/:commentId", authMiddleware, issueController.deleteComment);

module.exports=issueRouter;
