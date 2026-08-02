const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewItemSchema = new Schema({
  severity: {
    type: String,
    enum: ["critical", "warning", "suggestion", "praise"],
    required: true,
  },
  line: {
    type: Number,
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  suggestion: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ["bug", "security", "performance", "style", "best-practice"],
    default: "best-practice",
  },
  dismissed: {
    type: Boolean,
    default: false,
  },
});

const AiReviewSchema = new Schema(
  {
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    items: [ReviewItemSchema],
    score: {
      type: Number, // Code health score 0-100
      default: 85,
    },
    summary: {
      type: String,
      default: "",
    },
    modelUsed: {
      type: String,
      default: "gemini-2.5-flash",
    },
  },
  { timestamps: true }
);

const AiReview = mongoose.model("AiReview", AiReviewSchema);

module.exports = AiReview;
