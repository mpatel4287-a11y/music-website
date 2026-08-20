import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Lock,
  LockOpen,
  Sparkles,
  Link,
  Users,
} from "lucide-react";

export default function ShareModal({
  roomId,
  passcode,
  hasPasscode,
  isOpen,
  onClose,
  showToast,
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [includePassInLink, setIncludePassInLink] = useState(true);

  if (!isOpen) return null;

  let inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
  if (hasPasscode && passcode && includePassInLink) {
    inviteUrl += `&pass=${encodeURIComponent(passcode)}`;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    if (showToast) showToast("🔗 Invite link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    if (showToast) showToast("📋 Room ID copied!", "success");
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Share2 size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="modal-title">Invite Friends</h3>
              <p className="modal-subtitle">Share this room to listen together in sync</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Direct 1-Click Link */}
          <div className="share-section">
            <label className="share-label">
              <Link size={14} /> Direct Join Link (1-Click)
            </label>
            <div className="copy-input-group">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="copy-input-field"
              />
              <button
                type="button"
                className={`copy-action-btn ${copiedLink ? "copied" : ""}`}
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <>
                    <Check size={16} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Passcode toggle option if room has passcode */}
          {hasPasscode && passcode && (
            <div className="passcode-include-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includePassInLink}
                  onChange={(e) => setIncludePassInLink(e.target.checked)}
                />
                <span>Include passcode in URL for instant 1-click entry</span>
              </label>
            </div>
          )}

          {/* Manual Room Credentials */}
          <div className="room-creds-grid">
            <div className="cred-box">
              <span className="cred-label">Room ID</span>
              <div className="cred-value-row">
                <span className="cred-code">{roomId}</span>
                <button
                  type="button"
                  className="icon-mini-btn"
                  onClick={handleCopyRoomId}
                  title="Copy Room ID"
                >
                  {copiedId ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="cred-box">
              <span className="cred-label">Passcode</span>
              <div className="cred-value-row">
                {hasPasscode && passcode ? (
                  <span className="cred-code text-warning">{passcode}</span>
                ) : (
                  <span className="cred-code text-dim">None (Public)</span>
                )}
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="share-tip-box">
            <Sparkles size={16} className="text-accent" />
            <p>
              Anyone with this link can join, listen in real-time, read synced lyrics, and request songs to play!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
          <button
            type="button"
            className="btn-primary-glow"
            onClick={handleCopyLink}
          >
            {copiedLink ? "Link Copied!" : "Copy Invite Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
