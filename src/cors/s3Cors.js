require("dotenv").config();
const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");
const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ["http://localhost:5173", "http://localhost:5500"],
      AllowedMethods: ["GET", "POST", "PUT"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function setCorsConfig() {
  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfig,
    });

    await s3.send(command);
    console.log("CORS configuration set successfully!");
  } catch (error) {
    console.error("Error setting CORS configuration:", error);
    console.error(JSON.stringify(error, null, 2));
  }
}

setCorsConfig();
