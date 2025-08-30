# AWS S3 + Node.js (TypeScript) — Step‑by‑Step Guide

Build a tiny Node/TypeScript app that lists buckets and creates **pre‑signed URLs** for S3 objects 
---

## ✅ Prerequisites

* **Node.js** ≥ 18 (LTS recommended)
* **pnpm** package manager
* An **AWS account** with permissions to create IAM users and S3 buckets

---

## 1) Create AWS resources (once)

### 1.1 Create an S3 bucket

* Region: `ap-south-1` (Mumbai) — or your choice
* Bucket name: `your-bucket-name` (globally unique)

### 1.2 Create an IAM user (Programmatic access)

* Create a user like `s3-presign-user`
* Attach a **least‑privilege policy** for just your bucket (replace `<YOUR_BUCKET>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::<YOUR_BUCKET>"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<YOUR_BUCKET>/*"
    }
  ]
}
```

> Save the **Access Key ID** and **Secret Access Key** **locally only**. Never paste them into code or commit history.

---

## 2) Initialize the project

```bash
# 2.1 Init a project
pnpm init -y

# 2.2 Install AWS SDK v3 + presigner + env loader
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner dotenv

# 2.3 (TypeScript tooling)
pnpm add -D typescript tsx @types/node

# 2.4 Create TS config
npx tsc --init --rootDir src --outDir dist --esModuleInterop --module ESNext --moduleResolution Bundler --target ES2022 --resolveJsonModule --skipLibCheck
```

> We use **tsx** for a smooth TypeScript runtime (`pnpm dev` runs TS directly).

---

## 3) Project structure

```
.
├── src
│   └── index.ts
├── .env            # NEVER commit this
├── .env.example    # Safe template (commit this)
├── .gitignore
├── package.json
└── tsconfig.json
```

### 3.1 `.gitignore`

```gitignore
node_modules
.env
.DS_Store
.dist
```

### 3.2 `.env.example` (copy to `.env` and fill values)

```dotenv
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name
```

> Commit **`.env.example`** (placeholders), but never commit **`.env`**.

---

## 4) Code — List buckets & pre‑sign URLs

Create `src/index.ts`:

```ts
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
```

### 4.1 Add scripts to `package.json`

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts"
  }
}
```

Run it:

```bash
pnpm dev
```




