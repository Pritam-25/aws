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
import 'dotenv/config';
import { S3Client, ListBucketsCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET_NAME;

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing AWS credentials or region in .env');
}

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

async function listBuckets() {
  const res = await s3.send(new ListBucketsCommand({}));
  return (res.Buckets ?? []).map(b => b.Name);
}

export async function presignGet(key: string, expiresInSeconds = 3600) {
  if (!bucket) throw new Error('S3_BUCKET_NAME missing in .env');
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function presignPut(key: string, contentType = 'application/octet-stream', expiresInSeconds = 3600) {
  if (!bucket) throw new Error('S3_BUCKET_NAME missing in .env');
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

(async () => {
  console.log('Buckets:', await listBuckets());
  const getUrl = await presignGet('example.png');
  console.log('GET URL:', getUrl);
  const putUrl = await presignPut('upload.png', 'image/png');
  console.log('PUT URL:', putUrl);
})();
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




