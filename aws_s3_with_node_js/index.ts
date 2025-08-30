import { S3Client, GetObjectCommand  } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ✅ Load credentials & config from environment variables (never hard-code secrets!)
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const regionName = process.env.AWS_REGION;
const s3BucketName = process.env.S3_BUCKET_NAME;

// 🚨 Safety check: Throw error if required env vars are missing
if (!accessKeyId || !secretAccessKey) {
  throw new Error("Missing AWS credentials in environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
}

// ✅ Create S3 client (shared for all S3 commands)
const client = new S3Client({
  region: regionName, // AWS region (e.g., ap-south-1)
  credentials: {
    accessKeyId,      // IAM User/Role Access Key
    secretAccessKey,  // IAM User/Role Secret Key
  }
});

// 📌 Function to generate a pre-signed GET URL for a given object key
//    - Bucket: the S3 bucket name
//    - Key:    the object (file) inside the bucket
//    - expiresIn: URL validity duration in seconds (default 3600 = 1 hour)
async function getObjectUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: s3BucketName, // The target bucket
    Key: key,             // The file name inside the bucket
  });

  // Generates a signed URL that allows temporary access to the object
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return url;
}

// 🎯 Example usage
async function main() {
  // Replace "gym_memory.png" with your object key in S3
  const presignedUrl = await getObjectUrl("gym_memory.png");
  console.log("Presigned URL for image: ", presignedUrl);
}

main();
