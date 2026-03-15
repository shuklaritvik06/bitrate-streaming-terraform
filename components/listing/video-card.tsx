import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StreamCardProps } from "@/hls/types/hls-types";

const imageLoader = ({ src }: { src: string }) => src;

const VideoCard: React.FC<StreamCardProps> = ({
  uuid,
  thumbnailUrl,
  title,
  description,
}) => {
  return (
    <Link href={`/stream/${uuid}`}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer">
        <Image
          loader={imageLoader}
          src={thumbnailUrl}
          alt={`Thumbnail ${uuid}`}
          width={0}
          height={0}
          className="object-cover w-full h-40"
        />
        <div className="p-4">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
