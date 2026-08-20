import React, { useState, useEffect } from "react";
import {
  Disc3,
  Users,
  Lock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  LogIn,
  KeyRound,
  Radio,
  Music2,
  ShieldCheck,
} from "lucide-react";

const AVATAR_COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#f43f5e",
  "#14b8a6",
];

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
];

export default function CreateJoinModal({
  initialRoomId = "",
  initialPasscode = "",
  onCreateRoom,
  onJoinRoom,
  isLoading,
  errorMessage,
  clearError,
}) {
  const [activeTab, setActiveTab] = useState(initialRoomId ? "join" : "create");
  const [username, setUsername] = useState(() => {
    return (
      localStorage.getItem("musync_username") ||
      RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
    );
  });
  const [avatarColor, setAvatarColor] = useState(() => {
    return (
      localStorage.getItem("musync_avatar_color") ||
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    );
  });

  // Create room state
  const [createRoomId, setCreateRoomId] = useState(
    () => `vibe-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [createPasscode, setCreatePasscode] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);

  // Join room state
  const [joinRoomId, setJoinRoomId] = useState(initialRoomId || "");
  const [joinPasscode, setJoinPasscode] = useState(initialPasscode || "");

  useEffect(() => {
    if (initialRoomId) {
      setJoinRoomId(initialRoomId);
      setActiveTab("join");
    }
    if (initialPasscode) {
      setJoinPasscode(initialPasscode);
    }
  }, [initialRoomId, initialPasscode]);

  const generateRandomRoomId = () => {
    const prefixes = ["chill", "beat", "night", "lounge", "wave", "vibe", "disco", "pulse"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setCreateRoomId(`${prefix}-${num}`);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !createRoomId.trim()) return;
    localStorage.setItem("musync_username", username.trim());
    localStorage.setItem("musync_avatar_color", avatarColor);
    onCreateRoom({
      roomId: createRoomId.trim(),
      passcode: requirePasscode ? createPasscode.trim() : "",
      username: username.trim(),
      avatarColor,
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !joinRoomId.trim()) return;
    localStorage.setItem("musync_username", username.trim());
    localStorage.setItem("musync_avatar_color", avatarColor);
    onJoinRoom({
      roomId: joinRoomId.trim(),
      passcode: joinPasscode.trim(),
      username: username.trim(),
      avatarColor,
    });
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-backdrop-glow"></div>

      <div className="onboarding-container">
        {/* Brand Banner */}
        <div className="onboarding-brand">
          <div className="brand-badge">
            <Radio size={16} className="pulse-icon text-accent" />
            <span>Live Social Listening</span>
          </div>
          <div className="brand-title-wrap">
            <div className="brand-logo-icon">
              <Disc3 size={38} className="spin-slow text-accent" />
            </div>
            <h1 className="brand-title">Musync</h1>
          </div>
          <p className="brand-tagline">
            Listen to synced music together in real-time with live lyrics, interactive queue, and song requests.
          </p>
        </div>

        {/* User Identity Section */}
        <div className="identity-card">
          <div className="identity-header">
            <span className="identity-title">Your Listening Identity</span>
            <button
              type="button"
              className="randomize-btn"
              onClick={() => {
                const randomName =
                  RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] +
                  "-" +
                  Math.floor(Math.random() * 100);
                setUsername(randomName);
              }}
            >
              <Sparkles size={14} /> Randomize
            </button>
          </div>

          <div className="identity-inputs">
            <div
              className="avatar-preview"
              style={{ backgroundColor: avatarColor }}
              title="Click a color below to change avatar"
            >
              {username.charAt(0).toUpperCase() || "M"}
            </div>
            <div className="username-input-wrap">
              <input
                type="text"
                className="input-field"
                placeholder="Enter your username..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) clearError();
                }}
                maxLength={24}
                required
              />
            </div>
          </div>

          {/* Avatar Color Palette */}
          <div className="color-palette">
            <span className="color-palette-label">Avatar Color:</span>
            <div className="color-dots">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-dot ${avatarColor === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAvatarColor(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="auth-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Room Action Tabs */}
        <div className="room-tabs-card">
          <div className="tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("create");
                if (errorMessage) clearError();
              }}
            >
              <PlusCircle size={18} />
              <span>Create Room</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "join" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("join");
                if (errorMessage) clearError();
              }}
            >
              <LogIn size={18} />
              <span>Join Room</span>
            </button>
          </div>

          {/* CREATE ROOM FORM */}
          {activeTab === "create" ? (
            <form onSubmit={handleCreateSubmit} className="tab-content-form">
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="create-room-id">Room Name / ID</label>
                  <button
                    type="button"
                    className="text-link-btn"
                    onClick={generateRandomRoomId}
                  >
                    Generate New
                  </button>
                </div>
                <div className="input-with-icon">
                  <Music2 size={18} className="input-icon" />
                  <input
                    id="create-room-id"
                    type="text"
                    className="input-field"
                    placeholder="e.g. chill-lounge-99"
                    value={createRoomId}
                    onChange={(e) => setCreateRoomId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    required
                  />
                </div>
                <span className="input-hint">
                  You will be the 👑 <strong>Room Host</strong> with full playback & queue controls.
                </span>
              </div>

              {/* Passcode Toggle */}
              <div className="passcode-toggle-card">
                <div className="toggle-info">
                  <div className="toggle-icon-wrap">
                    <ShieldCheck size={18} className="text-accent" />
                  </div>
                  <div>
                    <div className="toggle-title">Room Passcode</div>
                    <div className="toggle-desc">Protect your room from random visitors</div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={requirePasscode}
                    onChange={(e) => setRequirePasscode(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {requirePasscode && (
                <div className="form-group slide-down">
                  <label htmlFor="create-passcode">Set Passcode</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      id="create-passcode"
                      type="text"
                      className="input-field"
                      placeholder="e.g. 1234 or party2026"
                      value={createPasscode}
                      onChange={(e) => setCreatePasscode(e.target.value)}
                      required={requirePasscode}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="submit-action-btn primary-glow"
                disabled={isLoading || !username.trim() || !createRoomId.trim()}
              >
                {isLoading ? (
                  <div className="spinner-sm"></div>
                ) : (
                  <>
                    <span>Launch Room</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* JOIN ROOM FORM */
            <form onSubmit={handleJoinSubmit} className="tab-content-form">
              <div className="form-group">
                <label htmlFor="join-room-id">Room ID or Invite Code</label>
                <div className="input-with-icon">
                  <Users size={18} className="input-icon" />
                  <input
                    id="join-room-id"
                    type="text"
                    className="input-field"
                    placeholder="e.g. vibe-4820"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toLowerCase().trim())}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="join-passcode">Passcode (if required)</label>
                  <span className="badge-optional">Optional</span>
                </div>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="join-passcode"
                    type="text"
                    className="input-field"
                    placeholder="Enter passcode if protected"
                    value={joinPasscode}
                    onChange={(e) => setJoinPasscode(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submit-action-btn primary-glow"
                disabled={isLoading || !username.trim() || !joinRoomId.trim()}
              >
                {isLoading ? (
                  <div className="spinner-sm"></div>
                ) : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature Pills Footer */}
        <div className="onboarding-features-row">
          <div className="feature-pill">
            <span className="pill-dot"></span> Synced Audio
          </div>
          <div className="feature-pill">
            <span className="pill-dot"></span> Line-by-Line Lyrics
          </div>
          <div className="feature-pill">
            <span className="pill-dot"></span> Song Requests
          </div>
          <div className="feature-pill">
            <span className="pill-dot"></span> Shareable Links
          </div>
        </div>
      </div>
    </div>
  );
}
