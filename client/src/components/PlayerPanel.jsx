import React, { useState, memo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Maximize2,
  Plus,
  Volume2,
  VolumeX,
  Volume1,
  Radio,
  RefreshCw,
} from "lucide-react";

function PlayerPanel({
  roomState,
  isHost,
  currentTime,
  duration,
  isSeeking,
  onSeekChange,
  onSeekCommit,
  onTogglePlay,
  onSkipTrack,
  onManualResync,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) {
  const [likedCount, setLikedCount] = useState(392);
  const [hasLiked, setHasLiked] = useState(false);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const currentThumbnail =
    roomState?.thumbnail ||
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80";

  const handleLike = () => {
    if (hasLiked) {
      setLikedCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikedCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  return (
    <div className="player-card metallic-turntable-deck">
      {/* Metallic Turntable Top Plate */}
      <div className="turntable-header-bar">
        <div className="turntable-screw top-left"></div>
        <div className="turntable-screw top-right"></div>
        <div className="status-pill-pixel">
          <Radio size={12} className={roomState?.isPlaying ? "pulse-icon" : ""} />
          <span>{roomState?.isPlaying ? "LIVE SYNC" : "PAUSED"}</span>
        </div>

        <button
          type="button"
          className="resync-pill-btn pixel-resync"
          onClick={onManualResync}
          title="Force re-sync audio player with Host"
        >
          <RefreshCw size={11} />
          <span>Re-sync</span>
        </button>
      </div>

      {/* Realistic Metallic Vinyl Turntable Showcase */}
      <div className="turntable-deck-chassis">
        <div className="turntable-screw inner-left"></div>
        <div className="turntable-screw inner-right"></div>
        
        {/* Tonearm assembly representation */}
        <div className={`tonearm-assembly ${roomState?.isPlaying ? "engaged" : ""}`}>
          <div className="tonearm-pivot"></div>
          <div className="tonearm-shaft"></div>
          <div className="tonearm-headshell"></div>
        </div>

        {/* Rotary Pitch Knob & Power switch detailing */}
        <div className="turntable-knob pitch-knob" title="Pitch Control"></div>
        <div className="turntable-knob power-switch" title="Power Switch"></div>

        {/* Vinyl Disc with Album Art & 33 1/3 RPM Center Label */}
        <div className={`vinyl-disc turntable-record ${roomState?.isPlaying ? "spinning" : ""}`}>
          <div className="vinyl-groove outer"></div>
          <div className="vinyl-groove middle"></div>
          <div className="vinyl-groove inner"></div>
          
          <div className="vinyl-center-badge">
            <span className="rpm-text">33⅓ RPM</span>
            <div className="spindle-hole"></div>
          </div>
        </div>
      </div>

      {/* Song Metadata */}
      <div className="track-meta-section">
        <h2 className="track-title pixel-heading" title={roomState?.trackTitle || "The Suffering"}>
          {roomState?.trackTitle || "The Suffering"}
        </h2>
      </div>

      {/* Audio Waveform Level Visualizer (Black Vertical Bars) & Time */}
      <div className="waveform-scrubber-box">
        <div className="time-display-row pixel-time">
          <span className="time-text current">{formatTime(currentTime)}</span>
          
          {/* Dynamic Audio Visualizer Bars */}
          <div className={`waveform-bars pixel-bars ${roomState?.isPlaying ? "active" : "paused"}`}>
            {[...Array(24)].map((_, i) => {
              const heights = [0.4, 0.7, 1.0, 0.6, 0.85, 0.5, 0.9, 0.45, 0.8, 0.65, 0.35, 0.75];
              const h = heights[i % heights.length];
              return (
                <span
                  key={i}
                  className="waveform-bar black-bar"
                  style={{
                    height: roomState?.isPlaying ? `${Math.max(4, h * 18)}px` : "4px",
                  }}
                ></span>
              );
            })}
          </div>

          <span className="time-text total">{formatTime(duration)}</span>
        </div>

        {/* Hidden/Interactive Range Scrubber Bar */}
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
            className="custom-range-slider black-slider"
            disabled={!isHost && roomState?.users?.length > 1}
            title={
              !isHost && roomState?.users?.length > 1
                ? "Only Host can seek playback"
                : "Seek playback time"
            }
          />
        </div>
      </div>

      {/* Minimal Playback Controls matching mockup */}
      <div className="playback-actions-bar pixel-controls">
        <button
          type="button"
          className="control-icon-btn pixel-icon"
          onClick={() => {
            if (isHost || roomState?.users?.length <= 1) {
              const newTime = Math.max(0, currentTime - 10);
              onSeekCommit({ target: { value: newTime } });
            }
          }}
          disabled={!isHost && roomState?.users?.length > 1}
          title="Previous Track / Rewind"
        >
          <SkipBack size={18} />
        </button>

        {/* Solid Black Main Play / Pause Circle */}
        <button
          type="button"
          className={`main-play-btn solid-black-btn ${roomState?.isPlaying ? "playing" : ""}`}
          onClick={onTogglePlay}
          title={
            isHost || roomState?.users?.length <= 1
              ? roomState?.isPlaying
                ? "Pause"
                : "Play"
              : "Playback controlled by Room Host"
          }
        >
          {roomState?.isPlaying ? (
            <Pause size={24} fill="currentColor" color="#ffffff" />
          ) : (
            <Play size={24} fill="currentColor" color="#ffffff" style={{ marginLeft: "2px" }} />
          )}
        </button>

        <button
          type="button"
          className="control-icon-btn pixel-icon"
          onClick={onSkipTrack}
          disabled={!isHost && roomState?.users?.length > 1}
          title="Next Track"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Volume Control Bar */}
      <div className="volume-control-bar pixel-volume">
        <button
          type="button"
          className="volume-icon-btn"
          onClick={onToggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={15} />
          ) : volume < 50 ? (
            <Volume1 size={15} />
          ) : (
            <Volume2 size={15} />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
          className="volume-slider black-slider"
          title={`Volume: ${isMuted ? 0 : volume}%`}
        />
        <span className="volume-pct">{isMuted ? "0%" : `${volume}%`}</span>
      </div>
    </div>
  );
}

export default memo(PlayerPanel);

