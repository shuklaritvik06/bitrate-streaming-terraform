import { S3Client } from "@aws-sdk/client-s3";

let _s3: S3Client | null = null;

export const getS3 = (): S3Client => {
  if (!_s3) {
    const region = process.env.APP_AWS_REGION;
    const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        `Missing AWS credentials: region=${region}, accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}`,
      );
    }

    _s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  return _s3;
};
