const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function createBucket() {
  const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '3127f39d766da69608e7bedbb425e270',
    },
    forcePathStyle: true,
  });

  const bucketName = process.env.S3_BUCKET || 'agents-chat';

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket ${bucketName} already exists`);
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      // Bucket doesn't exist, create it
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket ${bucketName} created successfully`);
      } catch (createError) {
        console.error('Error creating bucket:', createError);
      }
    } else {
      console.error('Error checking bucket:', error);
    }
  }
}

await createBucket().catch(console.error);
