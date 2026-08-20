import React, { useState } from "react";
import { Sparkles, User, ArrowRight, Music, X } from "lucide-react";

const RANDOM_NAMES = [
  "GrooveMaster",
  "BeatExplorer",
  "VinylVibes",
  "SonicWave",
  "MelodySeeker",
  "NeonDJ",
  "AuraListener",
  "RhythmKnight",
  "EchoChaser",
  "PixelMelody",
];

const AVATAR_COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ef4444",
  "#14b8a6",
];

export default function NicknameModal({
  isOpen,
  onClose,
  currentUsername = "",
  currentAvatarColor = "#8b5cf6",
  onSave,
}) {
  const [name, setName] = useState(() => {
    return (
      currentUsername ||
      localStorage.getItem("musync_username") ||
      RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
    );
  });

  const [color, setColor] = useState(() => {
    return (
      currentAvatarColor ||
      localStorage.getItem("musync_avatar_color") ||
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    );
  });

  if (!isOpen) return null;

  const handleRandomize = () => {
    const random =
      RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] +
      "_" +
      Math.floor(10 + Math.random() * 90);
    setName(random);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalName = name.trim() || "Listener";
    localStorage.setItem("musync_username", finalName);
    localStorage.setItem("musync_avatar_color", color);
    onSave({ username: finalName, avatarColor: color });
    if (onClose) onClose();
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card nickname-modal-card">
        {onClose && currentUsername && (
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            style={{ position: "absolute", top: "1rem", right: "1rem" }}
          >
            <X size={18} />
          </button>
        )}

        <div className="onboarding-brand" style={{ marginBottom: "1rem" }}>
          <div className="brand-badge">
            <Music size={14} />
            <span>Welcome to Musync</span>
          </div>
          <h2 className="brand-title pixel-heading" style={{ fontSize: "1.6rem", margin: "0.5rem 0" }}>
            Choose Your Nickname
          </h2>
          <p className="brand-tagline" style={{ fontSize: "0.88rem" }}>
            Enter your display name to start exploring music lounges and joining live synced rooms.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="identity-card" style={{ padding: "1.25rem", margin: 0 }}>
            <div className="identity-header" style={{ marginBottom: "0.85rem" }}>
              <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <User size={15} /> Your Display Name
              </label>
              <button
                type="button"
                className="randomize-btn"
                onClick={handleRandomize}
                style={{ fontSize: "0.8rem" }}
              >
                <Sparkles size={13} /> Randomize
              </button>
            </div>

            <div className="identity-inputs" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div
                className="avatar-preview"
                style={{
                  backgroundColor: color,
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "1.1rem",
                  flexShrink: 0,
                }}
              >
                {name.trim() ? name.trim().charAt(0).toUpperCase() : "M"}
              </div>

              <input
                type="text"
                className="form-input"
                placeholder="Enter nickname..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                required
                autoFocus
              />
            </div>

            {/* Avatar Color Picker */}
            <div className="color-palette" style={{ marginTop: "1rem" }}>
              <span className="color-palette-label" style={{ fontSize: "0.8rem", fontWeight: "700" }}>
                Avatar Color:
              </span>
              <div className="color-dots" style={{ display: "flex", gap: "0.4rem", marginTop: "0.35rem" }}>
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-dot ${color === c ? "selected" : ""}`}
                    style={{
                      backgroundColor: c,
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: color === c ? "2px solid #000000" : "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="submit-action-btn primary-glow"
            style={{ width: "100%", marginTop: "1.25rem", padding: "0.85rem", fontSize: "1rem" }}
          >
            <span>Enter Musync</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
