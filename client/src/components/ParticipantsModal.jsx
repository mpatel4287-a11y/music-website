import React, { useState, useMemo } from "react";
import {
  Users,
  Crown,
  UserX,
  VolumeX,
  Volume2,
  Search,
  X,
  Shield,
  Radio,
  UserCheck,
} from "lucide-react";

export default function ParticipantsModal({
  isOpen,
  onClose,
  users = [],
  isHost,
  currentSocketId,
  currentUsername,
  onKickUser,
  onTransferHost,
  onToggleMuteUser,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmKickUser, setConfirmKickUser] = useState(null);
  const [confirmTransferUser, setConfirmTransferUser] = useState(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [users, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card participants-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Users size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="modal-title">Room Participants</h3>
              <p className="modal-subtitle">
                {users.length} {users.length === 1 ? "listener" : "listeners"} connected live
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Search & Host Hint */}
        <div className="participants-search-bar">
          <div className="search-input-group">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-main-input"
              placeholder="Search listeners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isHost && (
          <div className="host-management-banner">
            <Shield size={16} className="text-warning" />
            <span>
              <strong>Host Controls:</strong> You can transfer host rights 👑, mute chat 🔇, or remove listeners 🚫.
            </span>
          </div>
        )}

        {/* List of Users */}
        <div className="participants-list-container">
          {filteredUsers.length === 0 ? (
            <div className="tab-empty-state">
              <p className="state-subtitle">No matching participants found.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isCurrentUser =
                user.socketId === currentSocketId ||
                user.username === currentUsername;
              const userIsAdmin = Boolean(user.isAdmin);
              const userIsMuted = Boolean(user.isMuted);

              return (
                <div
                  key={user.socketId || user.username}
                  className={`participant-row-card ${
                    userIsAdmin ? "is-admin-card" : ""
                  }`}
                >
                  <div className="participant-info-left">
                    <div
                      className="profile-avatar-circle"
                      style={{
                        backgroundColor: user.avatarColor || "#6366f1",
                      }}
                    >
                      {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div className="participant-details">
                      <div className="participant-name-row">
                        <span className="participant-username">
                          {user.username}
                        </span>
                        {isCurrentUser && (
                          <span className="you-chip">You</span>
                        )}
                      </div>

                      <div className="participant-status-badges">
                        {userIsAdmin ? (
                          <span className="role-tag host">
                            <Crown size={11} /> Host
                          </span>
                        ) : (
                          <span className="role-tag listener">
                            <Radio size={11} /> Listener
                          </span>
                        )}

                        {userIsMuted && (
                          <span className="role-tag muted">
                            <VolumeX size={11} /> Muted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Host Action Controls */}
                  {isHost && !isCurrentUser && (
                    <div className="participant-actions">
                      {/* Toggle Mute */}
                      <button
                        className={`p-action-btn ${
                          userIsMuted ? "btn-unmute" : "btn-mute"
                        }`}
                        title={userIsMuted ? "Unmute in Chat" : "Mute in Chat"}
                        onClick={() => onToggleMuteUser(user)}
                      >
                        {userIsMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                      </button>

                      {/* Transfer Host */}
                      <button
                        className="p-action-btn btn-crown"
                        title="Make Room Host"
                        onClick={() => setConfirmTransferUser(user)}
                      >
                        <Crown size={15} />
                      </button>

                      {/* Kick / Remove */}
                      <button
                        className="p-action-btn btn-kick"
                        title="Remove from Room"
                        onClick={() => setConfirmKickUser(user)}
                      >
                        <UserX size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Confirmation Modal for Kick */}
        {confirmKickUser && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <UserX size={28} className="text-danger" />
              <h4>Remove Listener?</h4>
              <p>
                Are you sure you want to remove <strong>@{confirmKickUser.username}</strong> from this room?
              </p>
              <div className="confirm-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setConfirmKickUser(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger-confirm"
                  onClick={() => {
                    onKickUser(confirmKickUser);
                    setConfirmKickUser(null);
                  }}
                >
                  Remove User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Transfer Host */}
        {confirmTransferUser && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <Crown size={28} className="text-warning" />
              <h4>Transfer Room Host?</h4>
              <p>
                Make <strong>@{confirmTransferUser.username}</strong> the new Room Host? They will have full playback and room control.
              </p>
              <div className="confirm-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setConfirmTransferUser(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary-glow"
                  onClick={() => {
                    onTransferHost(confirmTransferUser);
                    setConfirmTransferUser(null);
                  }}
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
