"use client";

import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntroVideoPlayerProps {
  src: string;
  youtubeId?: string | null;
}

export function IntroVideoPlayer({ src, youtubeId }: IntroVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Direct video: autoplay muted when visible
  useEffect(() => {
    if (youtubeId) return; // YouTube handles its own playback

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [youtubeId]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  // YouTube embed with autoplay muted
  if (youtubeId) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden border border-border">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}`}
          title="Teacher introduction video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Direct video with autoplay muted + unmute button
  return (
    <div ref={containerRef} className="relative aspect-video rounded-2xl overflow-hidden border border-border">
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="w-full h-full bg-black object-contain"
        onClick={toggleMute}
      />
      {/* Mute/unmute button */}
      <button
        type="button"
        onClick={toggleMute}
        className={cn(
          "absolute bottom-3 right-3 p-2 rounded-full transition-colors",
          "bg-black/60 backdrop-blur-sm hover:bg-black/80",
          "text-white"
        )}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
