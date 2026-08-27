import React, { useState, useRef, useEffect, memo } from "react";
import {
  Search,
  ListMusic,
  Inbox,
  MessageSquare,
  Play,
  Plus,
  Trash2,
  Check,
  X,
  Send,
  Sparkles,
  Clock,
  User,
  Music,
  Users,
  Crown,
  UserX,
  VolumeX,
  Volume2,
  Radio,
  Reply,
} from "lucide-react";

const QUICK_SEARCH_PROMPTS = [
  "Lofi Chill Beats",
  "Top Global Hits",
  "Synthwave Vibes",
  "Acoustic Pop",
  "Late Night Drive",
];

const REACTION_EMOJIS = ["🔥", "❤️", "🎵", "🎉", "🚀", "👏", "💃", "🎧", "✨"];

function QueueAndRequests({
  roomId,
  isHost,
  username,
  avatarColor,
  users = [],
  isMuted = false,
  queue = [],
  requests = [],
  chatMessages = [],
  onSearch,
  searchResults = [],
  isSearching,
  onClearSearch,
  onRequestSong,
  onAcceptRequest,
  onRejectRequest,
  onAddToQueue,
  onRemoveFromQueue,
  onPlayQueueItem,
  onPlaySongDirect,
  onSendChat,
  onSendReaction,
  onKickUser,
  onTransferHost,
  onToggleMuteUser,
}) {
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'queue' | 'requests' | 'chat' | 'participants'
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [confirmKickUser, setConfirmKickUser] = useState(null);
  const [confirmTransferUser, setConfirmTransferUser] = useState(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const prevChatCountRef = useRef(chatMessages.length);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Unread chat red dot notification trigger
  useEffect(() => {
    if (chatMessages.length > prevChatCountRef.current) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (activeTab !== "chat" && lastMsg && lastMsg.username !== username && !lastMsg.system) {
        setHasUnreadChat(true);
      }
    }
    prevChatCountRef.current = chatMessages.length;
  }, [chatMessages, activeTab, username]);

  useEffect(() => {
    if (activeTab === "chat") {
      setHasUnreadChat(false);
    }
  }, [activeTab]);

  // Auto debounced search as user types inside Room Search Tab
  useEffect(() => {
    if (activeTab !== "search") return;
    
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      onSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, onSearch]);

  // Initial trending recommendations trigger when search tab opens empty
  useEffect(() => {
    if (activeTab === "search" && searchResults.length === 0 && !searchQuery) {
      onSearch("Trending Songs");
    }
  }, [activeTab, searchResults.length, searchQuery, onSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearch(searchQuery.trim());
  };

  const handleQuickSearch = (term) => {
    setSearchQuery(term);
    onSearch(term);
  };

  const handleStartReply = (msg) => {
    setReplyingTo({
      id: msg.id,
      username: msg.username,
      text: msg.text,
    });
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isMuted) return;
    const textToSend = chatInput.trim();
    const replyData = replyingTo ? { username: replyingTo.username, text: replyingTo.text } : null;
    setChatInput(""); // Clear immediately for instant perceived response
    setReplyingTo(null);
    onSendChat(textToSend, replyData);
  };

  return (
    <div className="studio-tabs-card">
      {/* Tab Navigation Header */}
      <div className="studio-tabs-nav">
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          <Search size={14} />
          <span>Search</span>
        </button>

        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "queue" ? "active" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          <ListMusic size={14} />
          <span>Queue</span>
          {queue.length > 0 && <span className="tab-count-badge">{queue.length}</span>}
        </button>

        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <Inbox size={14} />
          <span>Requests</span>
          {requests.length > 0 && (
            <span className="tab-count-badge pulse-badge">{requests.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("chat");
            setHasUnreadChat(false);
          }}
          title="Room Chat"
        >
          <div className="tab-icon-wrap">
            <MessageSquare size={14} />
            {hasUnreadChat && <span className="unread-red-dot" title="New message received"></span>}
          </div>
          <span>Chat</span>
          {chatMessages.length > 0 && (
            <span className="tab-count-badge subtle">{chatMessages.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`studio-tab-btn ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
          title="Manage Room Listeners"
        >
          <Users size={14} />
          <span>Users</span>
          {users.length > 0 && (
            <span className="tab-count-badge subtle">{users.length}</span>
          )}
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="studio-tab-body">
        {/* ================= 1. SEARCH & REQUEST TAB ================= */}
        {activeTab === "search" && (
          <div className="tab-pane search-pane">
            <form onSubmit={handleSearchSubmit} className="search-bar-form">
              <div className="search-input-group">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="search-main-input"
                  placeholder="Search song title, artist, or music track..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchQuery("");
                      onClearSearch();
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="search-submit-btn"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? <div className="spinner-xs"></div> : "Search"}
              </button>
            </form>

            {/* Quick Keyword Pills */}
            <div className="quick-tags-row">
              <span className="quick-tags-label">Try:</span>
              {QUICK_SEARCH_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="quick-tag-pill"
                  onClick={() => handleQuickSearch(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Search Results List */}
            <div className="search-results-list">
              {isSearching ? (
                <div className="tab-loading-state">
                  <div className="spinner-md text-accent"></div>
                  <p>Searching music tracks...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((song) => {
                  const isAlreadyRequested = requests.some((r) => r.videoId === song.videoId);

                  return (
                    <div key={song.videoId} className="song-result-card">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="result-thumbnail"
                      />
                      <div className="result-info">
                        <h4 className="result-title" title={song.title}>
                          {song.title}
                        </h4>
                        <div className="result-meta">
                          <span className="result-artist">{song.artist}</span>
                          <span className="result-dot">•</span>
                          <span className="result-duration">
                            <Clock size={11} /> {song.duration}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="result-actions">
                        {isHost ? (
                          <>
                            <button
                              type="button"
                              className="action-btn-sm play-now"
                              onClick={() => onPlaySongDirect(song)}
                              title="Play Now"
                            >
                              <Play size={13} fill="currentColor" />
                              <span>Play</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn-sm add-queue"
                              onClick={() => onAddToQueue(song)}
                              title="Add to upcoming Queue"
                            >
                              <Plus size={14} />
                              <span>Queue</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={`action-btn-sm request-btn ${
                              isAlreadyRequested ? "requested" : ""
                            }`}
                            onClick={() => onRequestSong(song)}
                            disabled={isAlreadyRequested}
                            title="Submit song request to Room Host"
                          >
                            {isAlreadyRequested ? (
                              <>
                                <Check size={13} />
                                <span>Requested</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Request Song</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="search-empty-prompt">
                  <Music size={36} className="text-dim" />
                  <p>Search for any song above to request or play in this room!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 2. UP NEXT (QUEUE) TAB ================= */}
        {activeTab === "queue" && (
          <div className="tab-pane queue-pane">
            <div className="pane-header-row">
              <span className="pane-heading">Upcoming Songs ({queue.length})</span>
              {isHost && queue.length > 0 && (
                <span className="pane-hint">Songs will play automatically in order</span>
              )}
            </div>

            <div className="queue-items-list">
              {queue.length === 0 ? (
                <div className="tab-empty-state">
                  <ListMusic size={40} className="text-dim" />
                  <p className="state-title">The Queue is empty</p>
                  <span className="state-subtitle">
                    Search and add songs, or ask friends to send requests!
                  </span>
                  <button
                    type="button"
                    className="empty-action-btn"
                    onClick={() => setActiveTab("search")}
                  >
                    <Search size={14} /> Search Songs
                  </button>
                </div>
              ) : (
                queue.map((item, idx) => (
                  <div key={item.id || idx} className="queue-item-card">
                    <div className="queue-order-number">{idx + 1}</div>
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="queue-thumbnail"
                    />
                    <div className="queue-item-details">
                      <h4 className="queue-title" title={item.title}>
                        {item.title}
                      </h4>
                      <div className="queue-subtext">
                        <span>{item.artist}</span>
                        {item.requestedBy && (
                          <span className="requester-chip">
                            By @{item.requestedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {isHost && (
                      <div className="queue-item-actions">
                        <button
                          type="button"
                          className="icon-action-btn play"
                          onClick={() => onPlayQueueItem(item.id)}
                          title="Play this song right now"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn delete"
                          onClick={() => onRemoveFromQueue(item.id)}
                          title="Remove from queue"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= 3. REQUESTS TAB ================= */}
        {activeTab === "requests" && (
          <div className="tab-pane requests-pane">
            <div className="pane-header-row">
              <span className="pane-heading">Pending Song Requests ({requests.length})</span>
              {isHost ? (
                <span className="pane-hint">Review and accept songs requested by listeners</span>
              ) : (
                <span className="pane-hint">Waiting for Room Host review</span>
              )}
            </div>

            <div className="requests-items-list">
              {requests.length === 0 ? (
                <div className="tab-empty-state">
                  <Inbox size={40} className="text-dim" />
                  <p className="state-title">No Pending Requests</p>
                  <span className="state-subtitle">
                    Listeners can search and request songs from the Search tab!
                  </span>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="request-item-card">
                    <img
                      src={req.thumbnail}
                      alt={req.title}
                      className="request-thumbnail"
                    />
                    <div className="request-details">
                      <h4 className="request-title" title={req.title}>
                        {req.title}
                      </h4>
                      <div className="request-meta">
                        <span className="request-artist">{req.artist}</span>
                        <div className="requester-user-tag">
                          <User size={11} />
                          <span>Requested by <strong>{req.requestedBy}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Host Controls */}
                    {isHost ? (
                      <div className="request-actions-row">
                        <button
                          type="button"
                          className="req-btn accept-queue"
                          onClick={() => onAcceptRequest(req.id, false)}
                          title="Accept and add to Queue"
                        >
                          <Plus size={13} />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          type="button"
                          className="req-btn accept-play"
                          onClick={() => onAcceptRequest(req.id, true)}
                          title="Accept and Play Immediately"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Play Now</span>
                        </button>

                        <button
                          type="button"
                          className="req-btn reject"
                          onClick={() => onRejectRequest(req.id)}
                          title="Decline request"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="pending-badge">
                        <Clock size={12} />
                        <span>Pending Host Review</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= 4. LIVE CHAT TAB ================= */}
        {activeTab === "chat" && (
          <div className="tab-pane chat-pane">
            {/* Chat Messages Stream (Exclusively User Messages) */}
            <div className="chat-messages-container">
              {chatMessages.filter((msg) => !msg.system).length === 0 ? (
                <div className="tab-empty-state">
                  <MessageSquare size={36} className="text-dim" />
                  <p className="state-title">Room Chat</p>
                  <span className="state-subtitle">Say hi to everyone listening!</span>
                </div>
              ) : (
                chatMessages
                  .filter((msg) => !msg.system)
                  .map((msg) => {
                    const isMe = msg.username === username;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-row ${isMe ? "mine" : "theirs"}`}
                      >
                        {!isMe && (
                          <div
                            className="chat-avatar-circle"
                            style={{ backgroundColor: msg.avatarColor || "#8b5cf6" }}
                          >
                            {msg.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="chat-bubble-content">
                          <div className="chat-sender-header">
                            {!isMe && <span className="chat-sender">{msg.username}</span>}
                            <button
                              type="button"
                              className="chat-reply-action-btn"
                              onClick={() => handleStartReply(msg)}
                              title={`Reply to @${msg.username}`}
                            >
                              <Reply size={11} />
                              <span>Reply</span>
                            </button>
                          </div>
                          <div className="chat-bubble">
                            {msg.replyTo && (
                              <div className="chat-reply-quoted-box">
                                <span className="quoted-author">@{msg.replyTo.username}</span>
                                <p className="quoted-text">"{msg.replyTo.text}"</p>
                              </div>
                            )}
                            <p>{msg.text}</p>
                          </div>
                          <span className="chat-time">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Replying Preview Banner */}
            {replyingTo && (
              <div className="reply-preview-banner">
                <div className="reply-preview-content">
                  <Reply size={13} className="text-accent" />
                  <span>
                    Replying to <strong>@{replyingTo.username}</strong>:{" "}
                    <em>
                      "{replyingTo.text.length > 35
                        ? replyingTo.text.substring(0, 35) + "..."
                        : replyingTo.text}"
                    </em>
                  </span>
                </div>
                <button
                  type="button"
                  className="cancel-reply-btn"
                  onClick={() => setReplyingTo(null)}
                  title="Cancel reply"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Mute Alert or Chat Input */}
            {isMuted ? (
              <div className="muted-chat-alert">
                <VolumeX size={15} />
                <span>You have been muted in room chat by the Host.</span>
              </div>
            ) : (
              <form onSubmit={handleChatSubmit} className="chat-input-form">
                <input
                  ref={chatInputRef}
                  type="text"
                  className="chat-input-field"
                  placeholder={
                    replyingTo
                      ? `Replying to @${replyingTo.username}...`
                      : "Type a message..."
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={200}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!chatInput.trim()}
                  title="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= 5. PARTICIPANTS / HOST MANAGEMENT TAB ================= */}
        {activeTab === "participants" && (
          <div className="tab-pane participants-pane">
            <div className="pane-header-row">
              <span className="pane-heading">Connected Listeners ({users.length})</span>
              {isHost && <span className="pane-hint text-warning">Host Controls Enabled</span>}
            </div>

            <div className="participants-tab-list">
              {users.map((user) => {
                const isCurrentUser = user.username === username;
                const userIsAdmin = Boolean(user.isAdmin);
                const userIsMuted = Boolean(user.isMuted);

                return (
                  <div
                    key={user.socketId || user.username}
                    className={`participant-row-card ${userIsAdmin ? "is-admin-card" : ""}`}
                  >
                    <div className="participant-info-left">
                      <div
                        className="profile-avatar-circle"
                        style={{ backgroundColor: user.avatarColor || "#6366f1" }}
                      >
                        {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="participant-details">
                        <div className="participant-name-row">
                          <span className="participant-username">{user.username}</span>
                          {isCurrentUser && <span className="you-chip">You</span>}
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
                        <button
                          className={`p-action-btn ${userIsMuted ? "btn-unmute" : "btn-mute"}`}
                          title={userIsMuted ? "Unmute in Chat" : "Mute in Chat"}
                          onClick={() => onToggleMuteUser && onToggleMuteUser(user)}
                        >
                          {userIsMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        </button>
                        <button
                          className="p-action-btn btn-crown"
                          title="Transfer Room Host"
                          onClick={() => setConfirmTransferUser(user)}
                        >
                          <Crown size={14} />
                        </button>
                        <button
                          className="p-action-btn btn-kick"
                          title="Remove from Room"
                          onClick={() => setConfirmKickUser(user)}
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Kick Dialog inside Tab */}
            {confirmKickUser && (
              <div className="confirm-overlay">
                <div className="confirm-card">
                  <UserX size={26} className="text-danger" />
                  <h4>Remove Listener?</h4>
                  <p>
                    Remove <strong>@{confirmKickUser.username}</strong> from this room?
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
                        if (onKickUser) onKickUser(confirmKickUser);
                        setConfirmKickUser(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Dialog inside Tab */}
            {confirmTransferUser && (
              <div className="confirm-overlay">
                <div className="confirm-card">
                  <Crown size={26} className="text-warning" />
                  <h4>Transfer Room Host?</h4>
                  <p>
                    Make <strong>@{confirmTransferUser.username}</strong> the new Room Host?
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
                        if (onTransferHost) onTransferHost(confirmTransferUser);
                        setConfirmTransferUser(null);
                      }}
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(QueueAndRequests);
