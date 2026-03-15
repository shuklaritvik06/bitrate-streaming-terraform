"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Hls, { Level } from "hls.js";

const QUALITY_OPTIONS = [
  { label: "Auto", value: -1 },
  { label: "240p", value: 0 },
  { label: "360p", value: 1 },
  { label: "480p", value: 2 },
  { label: "720p", value: 3 },
  { label: "1080p", value: 4 },
];

const baseHlsUrl = process.env.NEXT_PUBLIC_STREAM_URL;

export default function StreamVideo() {
  const params = useParams<{ uuid: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [qualityLevel, setQualityLevel] = useState<number>(-1);
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState<string | null>(null);

  const src = `${baseHlsUrl}/${params.uuid}/master.m3u8`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        video.play().catch(() => null);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError("Failed to load video stream.");
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => null);
    }
  }, [src]);

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = parseInt(e.target.value);
    setQualityLevel(level);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Video Player</h1>

        {error ? <p className="text-red-500 text-sm mb-4">{error}</p> : null}

        <div className="mb-6">
          <label
            htmlFor="quality"
            className="mr-2 text-xl font-semibold text-gray-700"
          >
            Select Quality:
          </label>
          <select
            id="quality"
            value={qualityLevel}
            onChange={handleQualityChange}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={-1}>Auto</option>
            {levels.map((level, index) => (
              <option key={index} value={index}>
                {level.height}p
              </option>
            ))}
          </select>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            controls
            playsInline
            width="100%"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
