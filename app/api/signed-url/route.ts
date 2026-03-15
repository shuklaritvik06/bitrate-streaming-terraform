import { getS3 } from "@/hls/lib/app-utils";
import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SignedUrlData } from "@/hls/types/hls-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const Bucket = process.env.VIDEOS_BUCKET;
  const continuationToken = searchParams.get("continuationToken") || undefined;
  const maxKeys = parseInt(searchParams.get("maxKeys") || "10");

  try {
    const s3 = getS3();

    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket,
        ContinuationToken: continuationToken,
        MaxKeys: maxKeys * 3,
      }),
    );

    const videoThumbnails: SignedUrlData = {};

    for (const item of listResponse.Contents || []) {
      if (!item.Key) continue;

      const parts = item.Key.split("/");
      if (parts.length !== 2) continue;

      const uuid = parts[0];
      const filename = parts[1];

      if (filename.startsWith("thumbnail_")) {
        const thumbnailUrl = await getSignedThumbnailUrl(item.Key, Bucket);
        if (thumbnailUrl) {
          videoThumbnails[uuid] = {
            ...videoThumbnails[uuid],
            thumbnailUrl,
          };
        }
      } else if (filename.startsWith("detail_")) {
        const objectResponse = await s3.send(
          new GetObjectCommand({ Bucket, Key: item.Key }),
        );
        const objectData = await streamToString(objectResponse.Body);
        videoThumbnails[uuid] = {
          ...videoThumbnails[uuid],
          details: JSON.parse(objectData),
        };
      }
    }

    return NextResponse.json({
      data: videoThumbnails,
      nextToken: listResponse.NextContinuationToken,
    });
  } catch (error) {
    console.error("Error fetching thumbnails:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

async function getSignedThumbnailUrl(
  key: string,
  Bucket: string | undefined,
): Promise<string | null> {
  try {
    const s3 = getS3();
    return await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), {
      expiresIn: 3600,
    });
  } catch {
    return null;
  }
}

const streamToString = (stream: unknown): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const readable = stream as NodeJS.ReadableStream;

    readable.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    readable.on("error", reject);
    readable.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};
