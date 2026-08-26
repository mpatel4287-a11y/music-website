import React, { memo } from "react";
import { Disc3, AlignLeft, MessageSquare, LogOut } from "lucide-react";

function MobileNav({ activeTab, onTabChange, isPlaying, requestsCount = 0, hasUnreadChat = false, onLeaveRoom }) {
  return (
    <nav className="mobile-bottom-nav">
      {/* Player Tab */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === "player" ? "active" : ""}`}
        onClick={() => onTabChange("player")}
        title="Player & Controls"
      >
        <div className="nav-icon-wrapper">
          <Disc3 size={20} className={isPlaying ? "spin-slow text-accent" : ""} />
          {isPlaying && <span className="active-dot-ping"></span>}
        </div>
        <span className="nav-label">Player</span>
      </button>

      {/* Lyrics Tab */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === "lyrics" ? "active" : ""}`}
        onClick={() => onTabChange("lyrics")}
        title="Live Synced Lyrics"
      >
        <div className="nav-icon-wrapper">
          <AlignLeft size={20} />
        </div>
        <span className="nav-label">Lyrics</span>
      </button>

      {/* Queue & Chat Studio Tab */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === "sidebar" ? "active" : ""}`}
        onClick={() => onTabChange("sidebar")}
        title="Queue, Requests & Chat"
      >
        <div className="nav-icon-wrapper">
          <MessageSquare size={20} />
          {hasUnreadChat ? (
            <span className="unread-red-dot"></span>
          ) : requestsCount > 0 ? (
            <span className="nav-badge-pill">{requestsCount}</span>
          ) : null}
        </div>
        <span className="nav-label">Lounge</span>
      </button>

      {/* Exit Room Action Button (Triggers LeaveConfirmModal) */}
      {onLeaveRoom && (
        <button
          type="button"
          className="mobile-nav-btn leave-btn"
          onClick={onLeaveRoom}
          title="Exit Room (with confirmation)"
        >
          <div className="nav-icon-wrapper text-danger">
            <LogOut size={20} />
          </div>
          <span className="nav-label text-danger">Exit</span>
        </button>
      )}
    </nav>
  );
}

export default memo(MobileNav);
