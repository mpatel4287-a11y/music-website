import React, { useState, memo } from "react";
import {
  Disc3,
  Users,
  Share2,
  Check,
  Lock,
  LockOpen,
  Eye,
  EyeOff,
  LogOut,
  UserCog,
  Compass,
  Radio,
  LogIn,
  Sun,
  Moon,
} from "lucide-react";

function Header({
  roomId,
  hasPasscode,
  passcode,
  isHost,
  username,
  avatarColor,
  users = [],
  onOpenShareModal,
  onOpenParticipantsModal,
  onLeaveRoom,
  showToast,
  viewMode = "lounge",
  onToggleViewMode,
  user,
  onOpenAuth,
  onLogout,
}) {
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);


  const handleQuickCopyLink = () => {
    let url = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    if (hasPasscode && passcode) {
      url += `&pass=${encodeURIComponent(passcode)}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    if (showToast) {
      showToast("🔗 Invite link copied to clipboard!", "success");
    }
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header className="app-header">
      {/* Brand & Room Info */}
      <div className="header-left">
        <div className="brand-badge-link">
          <div className="logo-icon-pulse">
            <Disc3 size={24} className="spin-slow text-accent" />
          </div>
          <span className="brand-name pixel-font-title">Musync</span>
        </div>


        {/* View Mode Switcher (Dashboard vs Lounge) */}
        {onToggleViewMode && (
          <button
            type="button"
            className="view-mode-toggle-btn"
            onClick={onToggleViewMode}
            title={viewMode === "lounge" ? "Switch to Dashboard Explorer" : "Switch to Active Lounge"}
          >
            {viewMode === "lounge" ? (
              <>
                <Compass size={15} className="text-accent" />
                <span className="desktop-only">Dashboard</span>
              </>
            ) : (
              <>
                <Radio size={15} className="text-success pulse-icon" />
                <span className="desktop-only">Active Lounge</span>
              </>
            )}
          </button>
        )}

        {roomId && (
          <div className="room-meta-group">
            <div className="room-id-pill" title="Current Room ID">
              <span className="live-indicator-dot"></span>
              <span className="room-label desktop-only">ROOM:</span>
              <span className="room-value">{roomId}</span>
            </div>

            {hasPasscode ? (
              <div className="passcode-pill" title="Passcode Protected Room">
                <Lock size={13} className="text-warning" />
                {isHost && passcode ? (
                  <div className="passcode-revealer">
                    <span>{showPasscodeText ? passcode : "••••"}</span>
                    <button
                      type="button"
                      className="icon-mini-btn"
                      onClick={() => setShowPasscodeText(!showPasscodeText)}
                      title={showPasscodeText ? "Hide passcode" : "Show passcode"}
                    >
                      {showPasscodeText ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                ) : (
                  <span className="passcode-tag desktop-only">Protected</span>
                )}
              </div>
            ) : (
              <div className="passcode-pill public" title="Public Room (No passcode required)">
                <LockOpen size={13} className="text-muted" />
                <span className="passcode-tag desktop-only">Public</span>
              </div>
            )}

            {/* Quick Share Link Button */}
            <button
              type="button"
              className="share-invite-btn"
              onClick={onOpenShareModal || handleQuickCopyLink}
              title="Invite friends with shareable link"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-success" />
                  <span className="desktop-only">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span className="desktop-only">Invite Friends</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Online Listeners & User Profile */}
      <div className="header-right">
        {roomId && users && (
          <button
            type="button"
            className="listeners-avatar-stack-btn"
            onClick={onOpenParticipantsModal}
            title={isHost ? "Manage Room Participants" : "View Room Participants"}
          >
            <div className="listeners-count-badge">
              <Users size={14} />
              <span>{users.length}</span>
            </div>
            <div className="avatars-row desktop-only">
              {users.slice(0, 3).map((u) => (
                <div
                  key={u.socketId || u.username}
                  className="user-avatar-chip"
                  style={{ backgroundColor: u.avatarColor || "#8b5cf6" }}
                  title={`${u.username} ${u.isAdmin ? "(Host 👑)" : ""}`}
                >
                  {u.username.charAt(0).toUpperCase()}
                  {u.isAdmin && <span className="avatar-crown-indicator">👑</span>}
                </div>
              ))}
              {users.length > 3 && (
                <div className="user-avatar-chip more-chip">+{users.length - 3}</div>
              )}
            </div>
            {isHost && (
              <span className="manage-badge-label">
                <UserCog size={13} />
              </span>
            )}
          </button>
        )}



        {/* Account Authentication Badge */}
        {user ? (
          <div className="current-user-chip logged-in" title={`Logged in as ${user.email}`}>
            <div
              className="profile-avatar-circle"
              style={{ backgroundColor: user.avatarColor || avatarColor || "#8b5cf6" }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details desktop-only">
              <span className="profile-username">{user.username}</span>
              <span className="profile-role host">{user.region || "Global"}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                className="icon-mini-btn"
                onClick={onLogout}
                title="Log out of account"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>

        ) : (
          <button
            type="button"
            className="btn-auth-header"
            onClick={onOpenAuth}
            title="Log In or Create Account"
          >
            <LogIn size={14} />
            <span>Log In / Register</span>
          </button>
        )}

        {/* Leave Room Button */}
        {roomId && (
          <button
            type="button"
            className="leave-room-btn"
            onClick={onLeaveRoom}
            title="Leave this room"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}

export default memo(Header);
