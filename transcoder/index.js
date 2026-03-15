const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const s3 = new S3Client({ region: "us-west-2" });

const bucketName = "web-streamer-ritvik-prod";
const outputBucketName = "transformed-videos-streamer-ritvik-prod";

const resolutions = [
  {
    name: "240p",
    width: 426,
    height: 240,
    bitrate: 400000,
    avgBitrate: 350000,
  },
  {
    name: "360p",
    width: 640,
    height: 360,
    bitrate: 800000,
    avgBitrate: 700000,
  },
  {
    name: "480p",
    width: 854,
    height: 480,
    bitrate: 1400000,
    avgBitrate: 1300000,
  },
  {
    name: "720p",
    width: 1280,
    height: 720,
    bitrate: 2800000,
    avgBitrate: 2500000,
  },
  {
    name: "1080p",
    width: 1920,
    height: 1080,
    bitrate: 5000000,
    avgBitrate: 4500000,
  },
];

const downloadFromS3 = async (uuid) => {
  const key = `${uuid}/video_${uuid}.mp4`;
  const localVideoPath = `/tmp/${uuid}.mp4`;

  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucketName, Key: key }),
  );

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localVideoPath);
    response.Body.pipe(file)
      .on("finish", () => resolve(localVideoPath))
      .on("error", reject);
  });
};

const uploadToS3 = async (filePath, targetKey) => {
  const fileContent = fs.readFileSync(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: targetKey,
      Body: fileContent,
    }),
  );
};

const processVideo = (inputPath, outputDir, resolution, uuid) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .audioBitrate(resolution.name === "360p" ? 96 : 128)
      .size(`${resolution.width}x${resolution.height}`)
      .outputOptions([
        "-hls_time 10",
        "-preset ultrafast",
        "-hls_playlist_type vod",
        `-hls_base_url ${process.env.STREAM_URL}/${uuid}/`,
        `-hls_segment_filename ${outputDir}/${resolution.name}_%03d.ts`,
      ])
      .output(`${outputDir}/${resolution.name}.m3u8`)
      .on("progress", (progress) => {
        console.log(`Processing ${resolution.name}: ${progress.percent}% done`);
      })
      .on("end", () => {
        console.log(`Finished processing ${resolution.name}!`);
        resolve(resolution.name);
      })
      .on("error", (err) => {
        console.error(`Error processing video ${resolution.name}:`, err);
        reject(err);
      })
      .run();
  });
};

const createMasterPlaylist = (outputDir) => {
  const masterPlaylistPath = `${outputDir}/master.m3u8`;
  const content = resolutions
    .map(
      (r) =>
        `#EXT-X-STREAM-INF:BANDWIDTH=${r.bitrate},AVERAGE-BANDWIDTH=${r.avgBitrate},RESOLUTION=${r.width}x${r.height}\n${r.name}.m3u8`,
    )
    .join("\n");
  fs.writeFileSync(masterPlaylistPath, content);
  console.log("Master playlist created successfully!");
};

const transcodeVideo = async (uuid) => {
  const localVideoPath = `/tmp/${uuid}.mp4`;
  const outputDir = `/tmp/${uuid}_output`;

  try {
    console.log("Downloading video from S3...");
    await downloadFromS3(uuid);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    for (const resolution of resolutions) {
      console.log(`Processing video at ${resolution.name}...`);
      await processVideo(localVideoPath, outputDir, resolution, uuid);
    }

    console.log("Creating master playlist...");
    createMasterPlaylist(outputDir);

    console.log("Uploading HLS files to S3...");
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const s3Key = `${uuid}/${file}`;
      await uploadToS3(filePath, s3Key);
      console.log(`Uploaded: ${s3Key}`);
    }

    console.log("All files uploaded successfully!");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    if (fs.existsSync(localVideoPath)) {
      fs.unlinkSync(localVideoPath);
    }
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  }
};

const uuid = process.env.UUID_TO_PROCESS;

if (!uuid) {
  console.error("UUID_TO_PROCESS env var is required");
  process.exit(1);
}

transcodeVideo(uuid)
  .then(() => {
    console.log("Video is transcoded");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Transcoding failed:", err);
    process.exit(1);
  });
