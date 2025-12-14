"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import YouTubePlayer from "youtube-player";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronDown,
} from "lucide-react";
import { MUSIC_TRACKS } from "./music-tracks";

interface MusicPlayerProps {
  isPlaying: boolean;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
  volume: number;
}

export function MusicPlayer({
  isPlaying,
  onToggle,
  onVolumeChange,
  volume,
}: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<ReturnType<typeof YouTubePlayer> | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const handleNextRef = useRef<(() => void) | undefined>(undefined);
  const currentTrack = MUSIC_TRACKS[currentTrackIndex];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initPlayer = async () => {
      if (!isMounted) return;
      if (!playerContainerRef.current) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initPlayer, 200);
        }
        return;
      }

      if (!document.body.contains(playerContainerRef.current)) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initPlayer, 200);
        }
        return;
      }

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (error) {}
          playerRef.current = null;
          setIsPlayerReady(false);
        }

        if (playerContainerRef.current && isMounted) {
          const player = YouTubePlayer(playerContainerRef.current, {
            videoId: currentTrack.videoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
          });

          if (!isMounted) {
            try {
              player.destroy();
            } catch (e) {}
            return;
          }

          playerRef.current = player;

          // Set up event listeners
          player.on("ready", async () => {
            if (!isMounted) return;
            try {
              await player.setVolume(volume * 100);
              setIsPlayerReady(true);
              // Auto-play if isPlaying is true
              if (isPlaying) {
                await player.playVideo();
              }
            } catch (error) {
              setIsPlayerReady(true); // Still mark as ready
            }
          });

          player.on("error", () => {
            // Error handled silently
          });

          player.on("stateChange", async (event: any) => {
            if (!isMounted) return;
            // Auto-advance to next track when video ends
            // State 0 = ENDED
            if (event.data === 0) {
              if (handleNextRef.current) {
                handleNextRef.current();
              }
            }
          });
        }
      } catch (error) {
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(initPlayer, 1000);
        }
      }
    };

    const timeoutId = setTimeout(initPlayer, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {}
        playerRef.current = null;
        setIsPlayerReady(false);
      }
    };
  }, [currentTrack.videoId]);

  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      const controlPlayback = async () => {
        try {
          if (isPlaying) {
            await playerRef.current!.playVideo();
          } else {
            await playerRef.current!.pauseVideo();
          }
        } catch (error) {
          // Ignore errors
        }
      };
      controlPlayback();
    }
  }, [isPlaying, isPlayerReady]);

  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      const setVolumeAsync = async () => {
        try {
          await playerRef.current!.setVolume(volume * 100);
        } catch (error) {}
      };
      setVolumeAsync();
    }
  }, [volume, isPlayerReady]);

  const handlePlayPause = () => {
    onToggle();
  };

  const handlePrevious = () => {
    const newIndex =
      (currentTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    setCurrentTrackIndex(newIndex);
  };

  const handleNext = useCallback(() => {
    const newIndex = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
    setCurrentTrackIndex(newIndex);
  }, [currentTrackIndex]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const handleGenreChange = (genreIndex: number) => {
    if (genreIndex !== currentTrackIndex) {
      setCurrentTrackIndex(genreIndex);
    }
  };

  const handleMute = () => {
    onVolumeChange(volume > 0 ? 0 : 0.7);
  };

  return (
    <div className="hidden md:block pb-3">
      <div className="relative border-t border-base-content/5 pt-3">
        <div
          ref={playerContainerRef}
          style={{
            position: "fixed",
            top: "-9999px",
            left: "-9999px",
            width: "320px",
            height: "240px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
        <div className="mb-1.5 flex w-full items-start justify-between gap-3">
          <div className="relative z-20">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-1 whitespace-nowrap rounded-md bg-base-300 px-2 py-0.5 text-xs duration-100 hover:bg-primary/10"
                >
                  <span>{currentTrack.genre}</span>
                  <ChevronDown className="size-3 opacity-60 transition-transform group-hover:opacity-100" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  {MUSIC_TRACKS.map((track, index) => (
                    <button
                      key={track.id}
                      onClick={() => handleGenreChange(index)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/10 transition-colors ${
                        index === currentTrackIndex
                          ? "bg-primary/10 font-medium"
                          : ""
                      }`}
                    >
                      {track.genre}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative flex-1 pt-0.5 text-right marquee-container overflow-hidden">
            <div
              className="pointer-events-none absolute left-0 top-0 z-20 h-full w-16"
              style={{
                background:
                  "linear-gradient(to right, hsl(var(--b1)) 0%, hsl(var(--b1) / 0.8) 30%, hsl(var(--b1) / 0.4) 60%, transparent 100%)",
              }}
            ></div>
            <div
              className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16"
              style={{
                background:
                  "linear-gradient(to left, hsl(var(--b1)) 0%, hsl(var(--b1) / 0.8) 30%, hsl(var(--b1) / 0.4) 60%, transparent 100%)",
              }}
            ></div>
            <div className="text-xs font-medium text-base-content relative z-10">
              <div
                className="w-full items-center overflow-hidden"
                style={{
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
              >
                <span className="marquee-text">
                  {currentTrack.title}
                  <span> by {currentTrack.artist}</span>
                  <span className="ml-2">
                    {currentTrack.title}
                    <span> by {currentTrack.artist}</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Previous track"
              onClick={handlePrevious}
            >
              <SkipBack className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title={isPlaying ? "Pause (press space)" : "Play (press space)"}
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Next track"
              onClick={handleNext}
            >
              <SkipForward className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Mute"
              onClick={handleMute}
            >
              <Volume2 className="size-3.5" />
            </Button>
            <div
              className="relative cursor-pointer"
              style={{ height: "24px", display: "flex", alignItems: "center" }}
            >
              <div className="relative h-2 w-20">
                <div
                  className="absolute inset-0 rounded-full pointer-events-none shadow-inner"
                  style={{
                    background: "rgba(82, 32, 227, 0.15)",
                  }}
                ></div>
                <div
                  className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
                  style={{
                    width: `${volume * 100}%`,
                    background:
                      "linear-gradient(to bottom, rgba(82, 32, 227, 0.9), rgba(82, 32, 227, 0.7))",
                    boxShadow:
                      "inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => {
                    const newVolume = Number(e.target.value) / 100;
                    onVolumeChange(newVolume);
                  }}
                  className="volume-slider absolute inset-0 h-full w-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
