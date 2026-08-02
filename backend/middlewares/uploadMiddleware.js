const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Normalize path for Windows / Linux / Mac
    const relativePath = path
      .dirname(file.originalname)
      .replace(/\\/g, "/");

    const uploadPath = path.join(
      "uploads",
      req.params.id,
      relativePath
    );

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(null, path.basename(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

module.exports = upload;
