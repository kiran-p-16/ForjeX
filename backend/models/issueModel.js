const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    body: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const IssueSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

const Issue = mongoose.model("Issue", IssueSchema);
module.exports = Issue;