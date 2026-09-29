import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Plus,
  Radio,
  Sparkles,
} from "lucide-react";

export default function CoverFlowUpcoming({
  tracks = [],
  currentTrack = null,
  onPlayTrack,
  onAddToQueue,
  isHost = false,
  title = "Up Next (Queue)",
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // If no upcoming tracks in queue, provide curated upcoming list
  const displayTracks =
    tracks && tracks.length > 0
      ? tracks
      : [
          currentTrack || {
            videoId: "4NRXx6U8ABQ",
            title: "Blinding Lights",
            artist: "The Weeknd",
            thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
            duration: "3:20",
          },
          {
            videoId: "c183-W1s4h0",
            title: "Not Like Us",
            artist: "Kendrick Lamar",
            thumbnail: "https://i.ytimg.com/vi/c183-W1s4h0/hqdefault.jpg",
            duration: "4:34",
          },
          {
            videoId: "eVli-tstM5E",
            title: "Espresso",
            artist: "Sabrina Carpenter",
            thumbnail: "https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg",
            duration: "2:55",
          },
          {
            videoId: "V9PVRfjEBTI",
            title: "BIRDS OF A FEATHER",
            artist: "Billie Eilish",
            thumbnail: "https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg",
            duration: "3:17",
          },
          {
            videoId: "BddP6PYo2gs",
            title: "Kesariya",
            artist: "Arijit Singh",
            thumbnail: "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg",
            duration: "4:28",
          },
        ];

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeIndex >= displayTracks.length) {
      setActiveIndex(Math.max(0, displayTracks.length - 1));
    }
  }, [displayTracks.length, activeIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : displayTracks.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < displayTracks.length - 1 ? prev + 1 : 0));
  };

  const selectedTrack = displayTracks[activeIndex] || displayTracks[0];

  return (
    <div className="coverflow-stage-wrapper">
      <div className="coverflow-header">
        <div className="coverflow-title-group">
          <ListMusic size={18} className="text-accent" />
          <span className="coverflow-heading">{title}</span>
          <span className="coverflow-badge">{displayTracks.length} Songs</span>
        </div>
      </div>

      {/* 3D CoverFlow Stage */}
      <div className="coverflow-3d-scene">
        <div className="coverflow-carousel">
          {displayTracks.map((song, idx) => {
            const offset = idx - activeIndex;
            const isCenter = offset === 0;

            // Only render cards within range of 2 on each side for smooth 3D view
            if (Math.abs(offset) > 2) return null;

            const step1 = isMobile ? 80 : 120;
            const step2 = isMobile ? 140 : 210;

            let cardTransform = "";
            let zIndex = 1;
            let opacity = 0.5;

            if (isCenter) {
              cardTransform = `translateX(0) translateZ(${isMobile ? "30px" : "60px"}) scale(${isMobile ? 1.04 : 1.08})`;
              zIndex = 10;
              opacity = 1;
            } else if (offset === 1) {
              cardTransform = `translateX(${step1}px) translateZ(0) rotateY(-28deg) scale(${isMobile ? 0.82 : 0.88})`;
              zIndex = 5;
              opacity = 0.85;
            } else if (offset === -1) {
              cardTransform = `translateX(-${step1}px) translateZ(0) rotateY(28deg) scale(${isMobile ? 0.82 : 0.88})`;
              zIndex = 5;
              opacity = 0.85;
            } else if (offset === 2) {
              cardTransform = `translateX(${step2}px) translateZ(-40px) rotateY(-38deg) scale(${isMobile ? 0.68 : 0.75})`;
              zIndex = 2;
              opacity = 0.55;
            } else if (offset === -2) {
              cardTransform = `translateX(-${step2}px) translateZ(-40px) rotateY(38deg) scale(${isMobile ? 0.68 : 0.75})`;
              zIndex = 2;
              opacity = 0.55;
            }

            return (
              <div
                key={song.videoId || song.id || idx}
                className={`coverflow-card ${isCenter ? "active-center" : ""}`}
                style={{
                  transform: cardTransform,
                  zIndex,
                  opacity,
                }}
                onClick={() => setActiveIndex(idx)}
              >
                <img
                  src={song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`}
                  alt={song.title}
                  className="coverflow-card-img"
                />

                {/* Frosted Glass Overlay Badge on Center Card */}
                {isCenter && (
                  <div className="coverflow-active-badge">
                    <h4 className="coverflow-track-title">{song.title}</h4>
                    <p className="coverflow-track-artist">{song.artist}</p>
                  </div>
                )}

                {!isCenter && <div className="coverflow-dark-tint" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Pill Player Bar below 3D Cards (matching reference image) */}
      <div className="coverflow-pill-bar">
        <button
          type="button"
          className="coverflow-nav-arrow"
          onClick={handlePrev}
          title="Previous Track"
        >
          <ChevronLeft size={18} />
        </button>

        {isHost && (
          <button
            type="button"
            className="coverflow-play-btn"
            onClick={() => onPlayTrack && onPlayTrack(selectedTrack)}
            title="Play This Track Now"
          >
            <Play size={16} fill="currentColor" />
          </button>
        )}

        <div className="coverflow-now-info">
          <span className="coverflow-info-label">UP NEXT:</span>
          <span className="coverflow-info-title">{selectedTrack?.title}</span>
          <span className="coverflow-info-artist">• {selectedTrack?.artist}</span>
        </div>

        <button
          type="button"
          className="coverflow-nav-arrow"
          onClick={handleNext}
          title="Next Track"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
