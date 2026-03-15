import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const parseSecrets = () => {
  const raw = process.env.SECRETS;
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    const secret = data?.SecretString ? JSON.parse(data.SecretString) : data;

    const {
      APP_AWS_REGION,
      APP_AWS_ACCESS_KEY_ID,
      APP_AWS_SECRET_ACCESS_KEY,
      VIDEOS_BUCKET,
      NEXT_PUBLIC_STREAM_URL,
    } = secret ?? {};

    if (APP_AWS_REGION) process.env.APP_AWS_REGION = APP_AWS_REGION;
    if (APP_AWS_ACCESS_KEY_ID)
      process.env.APP_AWS_ACCESS_KEY_ID = APP_AWS_ACCESS_KEY_ID;
    if (APP_AWS_SECRET_ACCESS_KEY)
      process.env.APP_AWS_SECRET_ACCESS_KEY = APP_AWS_SECRET_ACCESS_KEY;
    if (VIDEOS_BUCKET) process.env.VIDEOS_BUCKET = VIDEOS_BUCKET;
    if (NEXT_PUBLIC_STREAM_URL)
      process.env.NEXT_PUBLIC_STREAM_URL = NEXT_PUBLIC_STREAM_URL;
  } catch {
    process.exitCode = 1;
  }
};

parseSecrets();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
