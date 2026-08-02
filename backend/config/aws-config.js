require("dotenv").config();
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.S3_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || "sample-demo-mygiti";

module.exports = { s3Client, S3_BUCKET };