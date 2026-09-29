import React, { memo } from "react";
import {
  ListMusic,
  Play,
  Trash2,
  Sparkles,
  Music2,
  Radio,
  Plus,
  Compass,
  Flame,
} from "lucide-react";
import CoverFlowUpcoming from "./CoverFlowUpcoming";

const QUICK_TRENDING_SUGGESTIONS = [
  { videoId: "vA83L5XN694", title: "Tauba Tauba", artist: "Karan Aujla", duration: "3:25", seconds: 205, thumbnail: "https://img.youtube.com/vi/vA83L5XN694/hqdefault.jpg" },
  { videoId: "eVli-tstM5E", title: "Espresso", artist: "Sabrina Carpenter", duration: "2:55", seconds: 175, thumbnail: "https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg" },
  { videoId: "V9PVRfjEBTI", title: "BIRDS OF A FEATHER", artist: "Billie Eilish", duration: "3:17", seconds: 197, thumbnail: "https://img.youtube.com/vi/V9PVRfjEBTI/hqdefault.jpg" },
  { videoId: "c183-W1s4h0", title: "Not Like Us", artist: "Kendrick Lamar", duration: "4:34", seconds: 274, thumbnail: "https://img.youtube.com/vi/c183-W1s4h0/hqdefault.jpg" },
  { videoId: "BddP6PYo2gs", title: "Kesariya", artist: "Arijit Singh", duration: "4:28", seconds: 268, thumbnail: "https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg" },
  { videoId: "yJg-Y5byMMw", title: "Big Dawgs", artist: "Hanumankind & Kalmi", duration: "3:53", seconds: 233, thumbnail: "https://img.youtube.com/vi/yJg-Y5byMMw/hqdefault.jpg" },
];

function CenterQueuePanel({
  queue = [],
  roomState,
  isHost,
  onPlaySongDirect,
  onAddToQueue,
  onRemoveFromQueue,
  onPlayQueueItem,
  onOpenSearch,
}) {
  const currentTitle = roomState?.trackTitle || "Lofi Chill Beats";
  const currentArtist = roomState?.artistName || "Lofi Girl";
  const currentThumb =
    roomState?.thumbnail ||
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60";
  const isPlaying = Boolean(roomState?.isPlaying);

  return (
    <div className="center-queue-card glass-panel">
      {/* Top Header */}
      <div className="center-queue-header">
        <div className="queue-header-left">
          <div className="header-icon-glow">
            <ListMusic size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="queue-title-main pixel-heading">Up Next & Queue</h2>
            <span className="queue-subtitle">
              {queue.length > 0
                ? `${queue.length} track${queue.length > 1 ? "s" : ""} waiting in sync queue`
                : "Real-time collaborative queue"}
            </span>
          </div>
        </div>

        <div className="queue-header-badges">
          <div className="status-pill-glass">
            <Radio size={12} className={isPlaying ? "pulse-icon text-success" : "text-muted"} />
            <span>{isPlaying ? "LIVE PLAYING" : "PAUSED"}</span>
          </div>
          {queue.length > 0 && (
            <span className="count-pill-glass">{queue.length} In Queue</span>
          )}
        </div>
      </div>

      {/* Scrollable Center Content */}
      <div className="center-queue-scroll-body">
        {/* 1. 3D CoverFlow Carousel */}
        <section className="center-coverflow-wrapper">
          <CoverFlowUpcoming
            tracks={queue.length > 0 ? queue : QUICK_TRENDING_SUGGESTIONS}
            onPlayTrack={onPlaySongDirect}
            onAddToQueue={onAddToQueue}
            isHost={isHost}
            title={queue.length > 0 ? "Upcoming In Queue" : "Featured Upcoming Hits"}
          />
        </section>

        {/* 2. Now Playing Mini Glass Card */}
        <div className="now-playing-glass-pill">
          <div className="now-playing-thumb-wrap">
            <img src={currentThumb} alt={currentTitle} className="now-playing-thumb" />
            {isPlaying && <span className="live-playing-badge">NOW</span>}
          </div>
          <div className="now-playing-meta">
            <span className="now-playing-label">Currently Playing</span>
            <h4 className="now-playing-title" title={currentTitle}>{currentTitle}</h4>
            <p className="now-playing-artist">{currentArtist}</p>
          </div>
          {isPlaying && (
            <div className="live-equalizer-bars">
              <span className="eq-bar b1"></span>
              <span className="eq-bar b2"></span>
              <span className="eq-bar b3"></span>
              <span className="eq-bar b4"></span>
            </div>
          )}
        </div>

        {/* 3. Up Next Queue List */}
        <div className="queue-list-section">
          <div className="section-title-row">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={14} className="text-accent" />
              <h3 className="section-title">Queue List</h3>
              <span className="section-count-tag">({queue.length})</span>
            </div>
            {isHost && queue.length > 0 && (
              <span className="host-auto-hint">Auto-advances in order</span>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="glass-empty-queue-box">
              <div className="empty-icon-ring">
                <Music2 size={32} className="text-accent" />
              </div>
              <h4 className="empty-title">The Lounge Queue is Empty</h4>
              <p className="empty-desc">
                Select from popular trending songs below or search any track to add to the live queue!
              </p>

              {/* Quick Add Suggestions Grid */}
              <div className="quick-suggestions-shelf">
                <div className="shelf-label">
                  <Flame size={14} className="text-warning" />
                  <span>Quick Add Trending Hits</span>
                </div>
                <div className="quick-suggestions-grid">
                  {QUICK_TRENDING_SUGGESTIONS.map((song) => (
                    <div key={song.videoId} className="quick-song-pill-glass">
                      <img src={song.thumbnail} alt={song.title} className="quick-thumb" />
                      <div className="quick-info">
                        <span className="quick-name">{song.title}</span>
                        <span className="quick-artist">{song.artist}</span>
                      </div>
                      <div className="quick-actions">
                        <button
                          type="button"
                          className="btn-quick-play"
                          onClick={() => onPlaySongDirect(song)}
                          title="Play Immediately"
                        >
                          <Play size={11} fill="currentColor" />
                        </button>
                        <button
                          type="button"
                          className="btn-quick-queue"
                          onClick={() => onAddToQueue(song)}
                          title="Add to Live Queue"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="queue-items-container">
              {queue.map((item, idx) => (
                <div key={item.id || idx} className="queue-item-card-glass">
                  <div className="item-order-badge">#{idx + 1}</div>
                  <img src={item.thumbnail} alt={item.title} className="item-thumb" />
                  <div className="item-meta">
                    <h4 className="item-title" title={item.title}>{item.title}</h4>
                    <div className="item-subline">
                      <span className="item-artist">{item.artist}</span>
                      {item.duration && <span className="item-duration">• {item.duration}</span>}
                      {item.requestedBy && (
                        <span className="item-requester-tag">
                          @{item.requestedBy}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="item-actions-group">
                    {isHost && (
                      <button
                        type="button"
                        className="btn-item-action play"
                        onClick={() => onPlayQueueItem ? onPlayQueueItem(item.id) : onPlaySongDirect(item)}
                        title="Play Now"
                      >
                        <Play size={13} fill="currentColor" />
                      </button>
                    )}
                    {isHost && (
                      <button
                        type="button"
                        className="btn-item-action remove"
                        onClick={() => onRemoveFromQueue(item.id)}
                        title="Remove from queue"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CenterQueuePanel);
