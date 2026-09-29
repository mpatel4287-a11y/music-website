import React, { useRef, useEffect, useState, memo } from "react";
import {
  Mic2,
  Maximize2,
  Minimize2,
  Sparkles,
  Music,
  Loader2,
  FileText,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  RefreshCw,
  Disc3,
  Sliders,
} from "lucide-react";

function LyricsPanel({
  lyrics,
  isLoadingLyrics,
  currentLineIndex,
  onLineClick,
  isHost,
  trackTitle,
  artistName,
  roomState,
  currentTime = 0,
  duration = 1,
  isSeeking = false,
  onSeekChange,
  onSeekCommit,
  onTogglePlay,
  onSkipTrack,
  onManualResync,
  volume = 80,
  isMuted = false,
  onVolumeChange,
  onToggleMute,
}) {
  const lyricsContainerRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState("both"); // 'both' | 'lyrics' | 'vinyl'

  // Smooth scroll ONLY the internal lyrics container
  useEffect(() => {
    if (currentLineIndex >= 0 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeEl = container.querySelector(".lyric-line.active");
      if (activeEl) {
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

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const isPlaying = Boolean(roomState?.isPlaying);
  const currentThumb =
    roomState?.thumbnail ||
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80";

  return (
    <div className={`lyrics-card glass-panel ${isFullScreen ? "fullscreen-mode" : ""} mode-${viewMode}`}>
      {/* Top Header */}
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
          {/* View Mode Switcher Pill */}
          <div className="view-mode-pill-group">
            <button
              type="button"
              className={`view-pill-btn ${viewMode === "both" ? "active" : ""}`}
              onClick={() => setViewMode("both")}
              title="Lyrics & Turntable"
            >
              Split
            </button>
            <button
              type="button"
              className={`view-pill-btn ${viewMode === "lyrics" ? "active" : ""}`}
              onClick={() => setViewMode("lyrics")}
              title="Full Lyrics View"
            >
              Lyrics
            </button>
            <button
              type="button"
              className={`view-pill-btn ${viewMode === "vinyl" ? "active" : ""}`}
              onClick={() => setViewMode("vinyl")}
              title="Full Turntable Deck"
            >
              Vinyl
            </button>
          </div>

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

      {/* Turntable Vinyl Section (Visible when mode is 'both' or 'vinyl') */}
      {(viewMode === "both" || viewMode === "vinyl") && (
        <div className={`turntable-mini-dock ${viewMode === "vinyl" ? "expanded" : ""}`}>
          <div className="turntable-deck-chassis">
            <div className={`tonearm-assembly ${isPlaying ? "engaged" : ""}`}>
              <div className="tonearm-pivot"></div>
              <div className="tonearm-shaft"></div>
              <div className="tonearm-headshell"></div>
            </div>

            <div className={`vinyl-disc turntable-record ${isPlaying ? "spinning" : ""}`}>
              <img src={currentThumb} alt="Vinyl Art" className="vinyl-cover-img" />
              <div className="vinyl-groove outer"></div>
              <div className="vinyl-groove middle"></div>
              <div className="vinyl-center-badge">
                <span className="rpm-text">33⅓</span>
                <div className="spindle-hole"></div>
              </div>
            </div>
          </div>

          {/* Track Meta & Controls */}
          <div className="mini-player-controls-wrap">
            <div className="mini-track-meta">
              <h4 className="mini-track-title pixel-heading" title={trackTitle || roomState?.trackTitle || "Lofi Beats"}>
                {trackTitle || roomState?.trackTitle || "Lofi Beats"}
              </h4>
              <p className="mini-artist-name">{artistName || roomState?.artistName || "Musync Lounge"}</p>
            </div>

            {/* Time Bar & Seekbar */}
            <div className="waveform-scrubber-box">
              <div className="time-display-row pixel-time">
                <span className="time-text current">{formatTime(currentTime)}</span>
                <div className={`waveform-bars pixel-bars ${isPlaying ? "active" : "paused"}`}>
                  {[0.4, 0.8, 1.0, 0.5, 0.9, 0.6, 0.85, 0.4, 0.7, 0.55].map((h, i) => (
                    <span
                      key={i}
                      className="waveform-bar"
                      style={{ height: isPlaying ? `${Math.max(4, h * 16)}px` : "4px" }}
                    ></span>
                  ))}
                </div>
                <span className="time-text total">{formatTime(duration)}</span>
              </div>

              {onSeekChange && (
                <div className="progress-bar-wrapper">
                  <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    step="0.2"
                    value={currentTime}
                    onChange={onSeekChange}
                    onMouseUp={onSeekCommit}
                    onTouchEnd={onSeekCommit}
                    className="custom-range-slider"
                    disabled={!isHost && roomState?.users?.length > 1}
                    title={!isHost && roomState?.users?.length > 1 ? "Only Host can seek playback" : "Seek playback"}
                  />
                </div>
              )}
            </div>

            {/* Playback Button Actions */}
            <div className="mini-playback-row">
              {onManualResync && (
                <button
                  type="button"
                  className="resync-pill-btn pixel-resync"
                  onClick={onManualResync}
                  title="Force re-sync with Host"
                >
                  <RefreshCw size={11} />
                  <span>Sync</span>
                </button>
              )}

              <div className="center-play-btns">
                {onTogglePlay && (
                  <button
                    type="button"
                    className="main-play-btn"
                    onClick={onTogglePlay}
                    disabled={!isHost && roomState?.users?.length > 1}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: "2px" }} />}
                  </button>
                )}

                {onSkipTrack && isHost && (
                  <button
                    type="button"
                    className="icon-action-btn skip"
                    onClick={onSkipTrack}
                    title="Skip to next track"
                  >
                    <SkipForward size={16} />
                  </button>
                )}
              </div>

              {/* Volume Slider */}
              {onVolumeChange && (
                <div className="volume-control-bar">
                  <button type="button" className="volume-icon-btn" onClick={onToggleMute}>
                    {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="volume-slider-input"
                    title={`Volume: ${isMuted ? 0 : volume}%`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Content Body (Visible when mode is 'both' or 'lyrics') */}
      {(viewMode === "both" || viewMode === "lyrics") && (
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
                    className={`lyric-line ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                    onClick={() => {
                      if (isHost && onLineClick) onLineClick(line.time);
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
                Enjoy the live music beats with your friends!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(LyricsPanel);
