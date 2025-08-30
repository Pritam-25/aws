import { S3Client, GetObjectCommand  } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// a client can be shared by different commands.
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error("Missing AWS credentials in environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
}

const client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId,
    secretAccessKey,
  }
});

async function getObjectUrl(key:string) {
  const command = new GetObjectCommand({
    Bucket: "private-bucket-nodejs-s3",
    Key: key
  });
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return url;
}

async function main() {
  const presignedUrl = await getObjectUrl("gym_memory.png");
  console.log("presigned url for image: ", presignedUrl);
}

main();