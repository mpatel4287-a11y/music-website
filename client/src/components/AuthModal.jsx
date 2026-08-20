import React, { useState } from "react";
import { X, Mail, Lock, User, Globe, Music, Sparkles, Check, ArrowRight } from "lucide-react";

const GENRE_OPTIONS = [
  { id: "lofi", label: "🎧 Lofi & Chill", color: "#8b5cf6" },
  { id: "pop", label: "✨ Pop Hits", color: "#ec4899" },
  { id: "hiphop", label: "🔥 Hip-Hop", color: "#f59e0b" },
  { id: "edm", label: "⚡ EDM & Dance", color: "#06b6d4" },
  { id: "bollywood", label: "🌺 Bollywood", color: "#10b981" },
  { id: "synthwave", label: "🌃 Synthwave", color: "#6366f1" },
  { id: "rock", label: "🎸 Rock & Indie", color: "#ef4444" },
  { id: "jazz", label: "🎷 Jazz Lounge", color: "#3b82f6" },
];

const REGION_OPTIONS = [
  "Global",
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
];

const AVATAR_COLORS = [
  "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#6366f1"
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess, backendUrl }) {
  const [tab, setTab] = useState("login"); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatarColor, setAvatarColor] = useState("#8b5cf6");
  const [selectedGenres, setSelectedGenres] = useState(["lofi", "pop"]);
  const [region, setRegion] = useState("Asia Pacific");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genreId));
      }
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    if (tab === "reset") {
      try {
        const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        });
        const data = await res.json();
        setIsLoading(false);

        if (data.success) {
          setSuccessMsg("Password reset successfully! Please log in with your new password.");
          setTab("login");
          setPassword(newPassword);
          setNewPassword("");
        } else {
          setErrorMsg(data.message || "Failed to reset password.");
        }
      } catch (err) {
        setIsLoading(false);
        setErrorMsg("Network error. Please make sure backend is running.");
      }
      return;
    }

    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      tab === "login"
        ? { email, password }
        : {
            email,
            password,
            username,
            avatarColor,
            musicGenres: selectedGenres,
            region,
          };

    try {
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMsg(data.message || "Authentication failed. Please check your details.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg("Network error. Please make sure backend is running.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Tabs */}
        <div className="auth-header">
          <div className="auth-tab-group">
            <button
              type="button"
              className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
              onClick={() => { setTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => { setTab("register"); setErrorMsg(""); setSuccessMsg(""); }}
            >
              Sign Up
            </button>
            {tab === "reset" && (
              <button
                type="button"
                className="auth-tab-btn active"
              >
                Reset Password
              </button>
            )}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && <div className="auth-success-alert">{successMsg}</div>}

        {/* Error Alert */}
        {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form-body">
          {tab === "register" && (
            <div className="form-group">
              <label className="form-label">
                <User size={14} /> Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Melody Lover"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          {tab !== "reset" && (
            <div className="form-group">
              <div className="form-label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label">
                  <Lock size={14} /> Password
                </label>
                {tab === "login" && (
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => { setTab("reset"); setErrorMsg(""); setSuccessMsg(""); }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {tab === "reset" && (
            <div className="form-group">
              <label className="form-label">
                <Lock size={14} /> Enter New Password
              </label>
              <input
                type="password"
                required
                placeholder="New password (min 4 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {tab === "register" && (
            <>
              {/* Avatar Color Picker */}
              <div className="form-group">
                <label className="form-label">Avatar Color</label>
                <div className="avatar-color-row">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-pick-btn ${avatarColor === c ? "selected" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setAvatarColor(c)}
                    >
                      {avatarColor === c && <Check size={12} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Music Taste Selector */}
              <div className="form-group">
                <label className="form-label">
                  <Music size={14} /> Select Your Preferred Music Tastes
                </label>
                <div className="genre-chips-grid">
                  {GENRE_OPTIONS.map((g) => {
                    const isSelected = selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`genre-chip ${isSelected ? "selected" : ""}`}
                        style={{
                          borderColor: isSelected ? g.color : "rgba(255,255,255,0.1)",
                          backgroundColor: isSelected ? `${g.color}22` : "rgba(255,255,255,0.04)",
                        }}
                        onClick={() => toggleGenre(g.id)}
                      >
                        <span>{g.label}</span>
                        {isSelected && <Check size={12} style={{ color: g.color }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={isLoading} className="auth-submit-btn">
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {tab === "login"
                    ? "Log In to Musync"
                    : tab === "register"
                    ? "Create Account & Experience Music"
                    : "Reset Password & Log In"}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

