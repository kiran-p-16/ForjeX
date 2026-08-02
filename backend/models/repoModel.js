const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepositorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    content: [
      {
        type: String,
      },
    ],
    visibility: {
      type: Boolean,
      default: true,
    },
    stars: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issues: [
      {
        type: Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],
    language: {
      type: String,
      default: "",
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// Compound unique: same owner can't have two repos with same name
// but different owners can
RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });

const Repository = mongoose.model("Repository", RepositorySchema);
module.exports = Repository;