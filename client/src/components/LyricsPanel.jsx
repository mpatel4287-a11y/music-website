import React, { useRef, useEffect, useState, memo } from "react";
import {
  Mic2,
  Maximize2,
  Minimize2,
  Sparkles,
  Music,
  Loader2,
  FileText,
} from "lucide-react";

function LyricsPanel({
  lyrics,
  isLoadingLyrics,
  currentLineIndex,
  onLineClick,
  isHost,
  trackTitle,
  artistName,
}) {
  const lyricsContainerRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Smooth scroll ONLY the internal lyrics container (NEVER scroll the whole window/page)
  useEffect(() => {
    if (currentLineIndex >= 0 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeEl = container.querySelector(".lyric-line.active");
      if (activeEl) {
        // Calculate offset relative to the container element
        const containerHeight = container.clientHeight;
        const lineOffsetTop = activeEl.offsetTop;
        const lineHeight = activeEl.clientHeight;
        const targetScrollTop = lineOffsetTop - containerHeight / 2 + lineHeight / 2;

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
      }
    }
  }, [currentLineIndex]);

  return (
    <div className={`lyrics-card ${isFullScreen ? "fullscreen-mode" : ""}`}>
      {/* Header */}
      <div className="lyrics-card-header">
        <div className="lyrics-title-group">
          <div className="lyrics-icon-badge">
            <Mic2 size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="lyrics-heading pixel-heading">Live Lyrics</h3>
            <span className="lyrics-subheading">
              {lyrics?.type === "synced"
                ? "Synchronized with audio"
                : lyrics?.type === "plain"
                ? "Plain text lyrics"
                : "Real-time lyrics engine"}
            </span>
          </div>
        </div>

        <div className="lyrics-header-actions">
          {lyrics?.type === "synced" && (
            <span className="synced-badge">
              <Sparkles size={12} /> Synced
            </span>
          )}

          <button
            type="button"
            className="fullscreen-toggle-btn"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Exit full screen lyrics" : "Full screen karaoke view"}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Lyrics Content Body - Internal scrolling only */}
      <div className="lyrics-card-body" ref={lyricsContainerRef}>
        {isLoadingLyrics ? (
          <div className="lyrics-state-box">
            <Loader2 size={36} className="spin-slow text-accent" />
            <p className="state-title">Fetching lyrics...</p>
            <span className="state-subtitle">Searching global LRC databases</span>
          </div>
        ) : lyrics?.type === "synced" && lyrics.lines && lyrics.lines.length > 0 ? (
          <div className="synced-lines-container">
            {lyrics.lines.map((line, idx) => {
              const isActive = idx === currentLineIndex;
              const isPast = idx < currentLineIndex;
              return (
                <p
                  key={idx}
                  className={`lyric-line ${isActive ? "active" : ""} ${
                    isPast ? "past" : ""
                  }`}
                  onClick={() => {
                    if (isHost) onLineClick(line.time);
                  }}
                  style={{ cursor: isHost ? "pointer" : "default" }}
                  title={isHost ? `Click to jump to line (${line.text})` : undefined}
                >
                  <span className="lyric-text">{line.text}</span>
                </p>
              );
            })}
          </div>
        ) : lyrics?.type === "plain" && lyrics.text ? (
          <div className="plain-lyrics-container">
            <div className="plain-lyrics-banner">
              <FileText size={14} /> Synchronized timestamps not available for this song
            </div>
            <pre className="plain-lyrics-text">{lyrics.text}</pre>
          </div>
        ) : (
          <div className="lyrics-state-box empty">
            <div className="empty-music-icon-wrap">
              <Music size={42} className="text-dim" />
            </div>
            <p className="state-title">No Lyrics Found</p>
            <span className="state-subtitle">
              Enjoy the music beats with your friends!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(LyricsPanel);
