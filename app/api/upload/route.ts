import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getS3 } from "@/hls/lib/app-utils";

export async function POST(request: NextRequest) {
  const uploadedKeys: string[] = [];
  const Bucket = process.env.VIDEOS_BUCKET;

  try {
    const s3 = getS3();
    const formData = await request.formData();
    const thumbnail = formData.get("thumbnail") as File;
    const video = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const Prefix = uuidv4();

    if (!thumbnail || !video) {
      return NextResponse.json(
        { error: "No thumbnail or video provided" },
        { status: 400 },
      );
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
    ];

    if (!allowedImageTypes.includes(thumbnail.type)) {
      return NextResponse.json(
        { error: `Thumbnail type not allowed: ${thumbnail.type}` },
        { status: 400 },
      );
    }

    const detailKey = `${Prefix}/detail_${Prefix}.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: detailKey,
        Body: JSON.stringify({ title, description }),
      }),
    );
    uploadedKeys.push(detailKey);

    const thumbnailBody = Buffer.from(await thumbnail.arrayBuffer());
    const thumbnailExtension = thumbnail.name.split(".").pop();
    const thumbnailKey = `${Prefix}/thumbnail_${Prefix}.${thumbnailExtension}`;
    await s3.send(
      new PutObjectCommand({ Bucket, Key: thumbnailKey, Body: thumbnailBody }),
    );
    uploadedKeys.push(thumbnailKey);

    const videoBody = Buffer.from(await video.arrayBuffer());
    const videoExtension = video.name.split(".").pop();
    const videoKey = `${Prefix}/video_${Prefix}.${videoExtension}`;
    await s3.send(
      new PutObjectCommand({ Bucket, Key: videoKey, Body: videoBody }),
    );
    uploadedKeys.push(videoKey);

    return NextResponse.json({
      thumbnail: {
        name: thumbnail.name,
        status: "uploaded",
        key: thumbnailKey,
      },
      video: { name: video.name, status: "uploaded", key: videoKey },
    });
  } catch (error: any) {
    console.error("Error uploading files:", error);
    try {
      const s3 = getS3();
      await Promise.all(
        uploadedKeys.map((key) =>
          s3
            .send(new DeleteObjectCommand({ Bucket, Key: key }))
            .catch((e) => console.error(`Error deleting ${key}:`, e)),
        ),
      );
    } catch {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
