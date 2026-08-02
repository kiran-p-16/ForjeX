const fs = require("fs").promises;
const path = require("path");
const { ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, S3_BUCKET } = require("../config/aws-config");

async function pullRepo() {
  const repoPath = path.resolve(process.cwd(), ".myGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: "commits/",
    });

    const data = await s3Client.send(listCommand);
    const objects = data.Contents || [];

    for (const object of objects) {
      const key = object.Key;
      const relativePath = key.replace("commits/", "");
      const targetPath = path.join(commitsPath, relativePath);
      const targetDir = path.dirname(targetPath);

      await fs.mkdir(targetDir, { recursive: true });

      const getCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      const response = await s3Client.send(getCommand);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      await fs.writeFile(targetPath, Buffer.concat(chunks));
    }

    console.log("All commits pulled from S3.");
  } catch (err) {
    console.error("Unable to pull:", err);
  }
}

module.exports = { pullRepo };