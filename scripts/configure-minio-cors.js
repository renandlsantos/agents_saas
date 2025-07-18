const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

async function configureCORS() {
  const s3Client = new S3Client({
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: '3127f39d766da69608e7bedbb425e270',
    },
    forcePathStyle: true,
  });

  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['ETag', 'x-amz-request-id'],
        MaxAgeSeconds: 3000,
      },
    ],
  };

  try {
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: 'agents-chat',
        CORSConfiguration: corsConfiguration,
      }),
    );
    console.log('CORS configuration set successfully');
  } catch (error) {
    console.error('Error setting CORS:', error);
  }
}

await configureCORS();
