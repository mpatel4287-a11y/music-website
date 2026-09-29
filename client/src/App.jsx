import React, { useState, useEffect, useRef, useCallback } from "react";
import YouTube from "react-youtube";
import io from "socket.io-client";
import { fetchLyrics } from "./lyricsHelper";

import CreateJoinModal from "./components/CreateJoinModal";
import Header from "./components/Header";
import PlayerPanel from "./components/PlayerPanel";
import LyricsPanel from "./components/LyricsPanel";
import CenterQueuePanel from "./components/CenterQueuePanel";
import QueueAndRequests from "./components/QueueAndRequests";
import ShareModal from "./components/ShareModal";
import ParticipantsModal from "./components/ParticipantsModal";
import FloatingReactions from "./components/FloatingReactions";
import ToastNotification from "./components/ToastNotification";
import MobileNav from "./components/MobileNav";
import NicknameModal from "./components/NicknameModal";
import DashboardView from "./components/DashboardView";
import LeaveConfirmModal from "./components/LeaveConfirmModal";

import "./App.css";

// Dynamic socket backend URL detection
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }
  // Production fallback to active Render backend URL
  return "https://musync-ligw.onrender.com";
};

const BACKEND_URL = getBackendUrl();

const socket = io(BACKEND_URL || undefined, {
  transports: ["polling", "websocket"],
  reconnectionAttempts: 10,
  autoConnect: true,
});

export default function App() {
  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem("musync_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("musync_theme", theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Navigation & View Mode State ('dashboard' | 'lounge')
  const [viewMode, setViewMode] = useState("dashboard");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isCreateJoinModalOpen, setIsCreateJoinModalOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  // Session & Room State
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [hasPasscode, setHasPasscode] = useState(false);
  const [username, setUsername] = useState(
    () => localStorage.getItem("musync_username") || ""
  );
  const [avatarColor, setAvatarColor] = useState(
    () => localStorage.getItem("musync_avatar_color") || "#8b5cf6"
  );
  const [isHost, setIsHost] = useState(false);
  const [isMainHost, setIsMainHost] = useState(false);
  const [roomState, setRoomState] = useState(null);

  // Initial invite URL query parsing
  const [initialUrlRoomId, setInitialUrlRoomId] = useState("");
  const [initialUrlPasscode, setInitialUrlPasscode] = useState("");

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  // Lyrics state
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const lastFetchedTrackRef = useRef("");

  // Chat State (Real-time dedicated state for 0ms ultra-fast messaging)
  const [chatMessages, setChatMessages] = useState([]);

  // Mobile Navigation State ('lyrics' | 'queue' | 'sidebar')
  const [activeMobileTab, setActiveMobileTab] = useState("queue");
  const [hasUnreadMobileChat, setHasUnreadMobileChat] = useState(false);
  const prevMobileChatCountRef = useRef(chatMessages.length);

  useEffect(() => {
    if (chatMessages.length > prevMobileChatCountRef.current) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (activeMobileTab !== "sidebar" && lastMsg && lastMsg.username !== username && !lastMsg.system) {
        setHasUnreadMobileChat(true);
      }
    }
    prevMobileChatCountRef.current = chatMessages.length;
  }, [chatMessages, activeMobileTab, username]);

  useEffect(() => {
    if (activeMobileTab === "sidebar") {
      setHasUnreadMobileChat(false);
    }
  }, [activeMobileTab]);

  // Modals, Overlays & Notifications
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const playerRef = useRef(null);
  const lyricsRef = useRef(null);
  const bgAudioRef = useRef(null);
  const currentLineIndexRef = useRef(-1);
  const isSeekingRef = useRef(false);
  const roomStateRef = useRef(null);
  const isHostRef = useRef(false);
  const roomIdRef = useRef("");
  const lastHostSyncEmitRef = useRef(0);
  const lastAutoSeekRef = useRef(0);
  const searchCacheRef = useRef({});

  const usernameRef = useRef(username);
  const avatarColorRef = useRef(avatarColor);
  const passcodeRef = useRef(passcode);
  const inRoomRef = useRef(inRoom);

  // Sync refs with state
  lyricsRef.current = lyrics;
  currentLineIndexRef.current = currentLineIndex;
  isSeekingRef.current = isSeeking;
  roomStateRef.current = roomState;
  isHostRef.current = isHost;
  roomIdRef.current = roomId;
  usernameRef.current = username;
  avatarColorRef.current = avatarColor;
  passcodeRef.current = passcode;
  inRoomRef.current = inRoom;

  // Helper for Toasts
  const showToast = useCallback((message, type = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Prompt user for display nickname on first site visit
  useEffect(() => {
    const savedName = localStorage.getItem("musync_username");
    if (!savedName) {
      setIsNicknameModalOpen(true);
    }
  }, []);

  // 1. Detect URL invite query params (?room=XYZ&pass=123 or hash route) & Session Auto-Rejoin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let roomParam = params.get("room");
    let passParam = params.get("pass");

    // Support hash route parsing e.g. /#/room/xyz
    if (!roomParam && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash.includes("room=")) {
        const hashParams = new URLSearchParams(hash);
        roomParam = hashParams.get("room");
        passParam = hashParams.get("pass") || passParam;
      } else if (hash.length > 0 && !hash.includes("=")) {
        roomParam = hash;
      }
    }

    const currentName =
      localStorage.getItem("musync_username") ||
      username ||
      `Listener-${Math.floor(100 + Math.random() * 900)}`;

    const currentColor =
      localStorage.getItem("musync_avatar_color") || avatarColor || "#8b5cf6";

    if (!username) setUsername(currentName);
    if (!avatarColor) setAvatarColor(currentColor);

    if (roomParam) {
      const cleanRoom = roomParam.trim().toLowerCase();
      const cleanPass = (passParam || "").trim();

      setInitialUrlRoomId(cleanRoom);
      setRoomId(cleanRoom);
      if (cleanPass) {
        setInitialUrlPasscode(cleanPass);
        setPasscode(cleanPass);
      }

      // 0ms instant entry into the room
      setIsAuthLoading(false);
      setInRoom(true);
      setViewMode("lounge");
      setRoomState((prev) => {
        if (prev && prev.roomId === cleanRoom) return prev;
        return {
          roomId: cleanRoom,
          trackTitle: "Lofi Chill Beats",
          artistName: "Lofi Girl",
          videoId: "jfKfPfyJRdk",
          thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60",
          isPlaying: false,
          currentTime: 0,
          users: [{ socketId: socket.id || "listener", username: currentName, isAdmin: false, avatarColor: currentColor }],
          queue: [],
          requests: [],
          chatMessages: [{ id: `msg_${Date.now()}`, system: true, text: `🎵 Connected to room "${cleanRoom}"!` }],
          isCurrentClientAdmin: false,
          isCurrentClientMainHost: false,
          hasPasscode: Boolean(cleanPass),
        };
      });

      localStorage.setItem(
        "musync_active_room",
        JSON.stringify({
          roomId: cleanRoom,
          passcode: cleanPass,
          username: currentName,
          avatarColor: currentColor,
        })
      );

      // Background socket synchronization
      if (!socket.connected) {
        try { socket.connect(); } catch (e) {}
      }

      socket.emit(
        "join-room",
        {
          roomId: cleanRoom,
          passcode: cleanPass,
          username: currentName,
          avatarColor: currentColor,
        },
        (res) => {
          if (res?.success) {
            setIsHost(Boolean(res.isAdmin));
          } else if (res?.requiresPasscode) {
            setAuthError(res.message || "Passcode required to join this room.");
            setInitialUrlRoomId(cleanRoom);
            setIsCreateJoinModalOpen(true);
            showToast(`🔒 Passcode required for room "${cleanRoom}"`, "warning");
          }
        }
      );
    } else {
      // Auto Rejoin saved room session if page reloaded without URL invite params
      try {
        const savedSessionStr = localStorage.getItem("musync_active_room");
        if (savedSessionStr) {
          const savedSession = JSON.parse(savedSessionStr);
          if (savedSession?.roomId) {
            const targetRoom = savedSession.roomId;
            const targetPass = savedSession.passcode || "";
            const targetUser = savedSession.username || currentName;
            const targetColor = savedSession.avatarColor || currentColor;

            if (targetRoom && targetUser) {
              setRoomId(targetRoom);
              setPasscode(targetPass);
              setUsername(targetUser);
              setAvatarColor(targetColor);
              setInRoom(true);
              setViewMode("lounge");
              setIsAuthLoading(false);

              setRoomState((prev) => {
                if (prev && prev.roomId === targetRoom) return prev;
                return {
                  roomId: targetRoom,
                  trackTitle: "Lofi Chill Beats",
                  artistName: "Lofi Girl",
                  videoId: "jfKfPfyJRdk",
                  thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60",
                  isPlaying: false,
                  currentTime: 0,
                  users: [{ socketId: socket.id || "listener", username: targetUser, isAdmin: false, avatarColor: targetColor }],
                  queue: [],
                  requests: [],
                  chatMessages: [{ id: `msg_${Date.now()}`, system: true, text: `🎵 Reconnected to room "${targetRoom}"!` }],
                  isCurrentClientAdmin: false,
                  isCurrentClientMainHost: false,
                  hasPasscode: Boolean(targetPass),
                };
              });

              if (!socket.connected) {
                try { socket.connect(); } catch (e) {}
              }

              socket.emit(
                "join-room",
                {
                  roomId: targetRoom,
                  passcode: targetPass,
                  username: targetUser,
                  avatarColor: targetColor,
                },
                (res) => {
                  if (res?.success) {
                    setIsHost(Boolean(res.isAdmin));
                  }
                }
              );
            }
          }
        }
      } catch (err) {
        console.error("Auto rejoin error:", err);
      }
    }
  }, [showToast]);

  // Media Session API Sync Effect for background lockscreen controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !roomState) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: roomState.trackTitle || "Musync Track",
        artist: roomState.artistName || "Musync Lounge",
        album: `Room: ${roomId}`,
        artwork: roomState.thumbnail
          ? [
              { src: roomState.thumbnail, sizes: "96x96", type: "image/jpeg" },
              { src: roomState.thumbnail, sizes: "128x128", type: "image/jpeg" },
              { src: roomState.thumbnail, sizes: "512x512", type: "image/jpeg" },
            ]
          : [],
      });

      navigator.mediaSession.playbackState = roomState.isPlaying ? "playing" : "paused";
    } catch (e) {
      // Ignore media session errors on unsupported browsers
    }
  }, [roomState, roomId]);

  // Global User Gesture Audio Activator (Unlocks Autoplay Policy for Listeners on First Click/Touch)
  useEffect(() => {
    const unlockAudio = () => {
      if (playerRef.current) {
        try {
          if (!isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
          }
          if (roomStateRef.current?.isPlaying) {
            const state = typeof playerRef.current.getPlayerState === "function" ? playerRef.current.getPlayerState() : -1;
            if (state !== 1) {
              playerRef.current.playVideo();
            }
          }
        } catch (e) {}
      }
    };

    window.addEventListener("click", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [isMuted, volume]);

  // 2. Setup Socket Listeners
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to Musync socket server:", socket.id);
      if (inRoomRef.current && roomIdRef.current && usernameRef.current) {
        socket.emit("join-room", {
          roomId: roomIdRef.current,
          passcode: passcodeRef.current || "",
          username: usernameRef.current,
          avatarColor: avatarColorRef.current || "#8b5cf6",
        });
      }
    });

    socket.on("sync-state", (state) => {
      if (!state) return;
      setRoomState(state);
      setIsHost(Boolean(state.isCurrentClientAdmin));
      setIsMainHost(Boolean(state.isCurrentClientMainHost));
      setHasPasscode(Boolean(state.hasPasscode));

      // Sync chat messages if initial or updated
      if (state.chatMessages && state.chatMessages.length > 0) {
        setChatMessages((prev) => {
          if (prev.length === 0) return state.chatMessages;
          // Merge preserving optimistic messages
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = state.chatMessages.filter((m) => !existingIds.has(m.id));
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
        });
      }

      // Synchronize music audio engine
      if (playerRef.current) {
        const player = playerRef.current;
        try {
          const currentUrl = typeof player.getVideoUrl === "function" ? player.getVideoUrl() || "" : "";
          const localTime = typeof player.getCurrentTime === "function" ? player.getCurrentTime() || 0 : 0;

          if (state.videoId && !currentUrl.includes(state.videoId)) {
            player.loadVideoById({
              videoId: state.videoId,
              startSeconds: state.currentTime || 0,
            });
            player.unMute();
            player.setVolume(volume);
          } else if (Math.abs(localTime - state.currentTime) > 2.0) {
            player.seekTo(state.currentTime, true);
          }

          if (state.isPlaying) {
            player.unMute();
            player.setVolume(volume);
            player.playVideo();
          } else {
            player.pauseVideo();
          }
        } catch (err) {
          console.error("Player sync error:", err);
        }
      }

      // Fetch lyrics if track changed
      const trackKey = `${state.trackTitle || ""}_${state.artistName || ""}`;
      if (state.trackTitle && trackKey !== lastFetchedTrackRef.current) {
        lastFetchedTrackRef.current = trackKey;
        setIsLoadingLyrics(true);
        fetchLyrics(state.trackTitle, state.artistName)
          .then((res) => {
            setLyrics(res);
            setCurrentLineIndex(-1);
          })
          .catch(() => setLyrics(null))
          .finally(() => setIsLoadingLyrics(false));
      }
    });

    // Fast Immediate New Chat Message Handler
    socket.on("new-chat-message", (chatItem) => {
      if (!chatItem) return;
      setChatMessages((prev) => {
        // Skip duplicate if already added optimistically
        if (prev.some((m) => m.id === chatItem.id || (m.optimistic && m.text === chatItem.text && m.username === chatItem.username))) {
          return prev.map((m) => (m.optimistic && m.text === chatItem.text ? chatItem : m));
        }
        return [...prev, chatItem];
      });
    });

    // Kicked / Removed from room by Host
    socket.on("kicked-from-room", (data) => {
      showToast(`🚫 ${data.reason || "You were removed from the room by the Host."}`, "error");
      setInRoom(false);
      setRoomState(null);
      setChatMessages([]);
      window.history.pushState({}, "", window.location.pathname);
    });

    socket.on("notification", (notif) => {
      if (notif?.message) {
        showToast(notif.message, notif.type || "info");
      }
    });

    socket.on("new-reaction", (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3500);
    });

    socket.on("user-joined", ({ username: joinedUser }) => {
      showToast(`👋 ${joinedUser} joined the room!`, "info");
    });

    return () => {
      socket.off("connect");
      socket.off("sync-state");
      socket.off("new-chat-message");
      socket.off("kicked-from-room");
      socket.off("notification");
      socket.off("new-reaction");
      socket.off("user-joined");
    };
  }, [showToast]);

  // Auto-scroll to top when switching views or opening modals
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [viewMode, isCreateJoinModalOpen, isNicknameModalOpen, inRoom]);

  // 3. Guaranteed 1-Second Audio & Lyrics Cross-Device Sync Engine
  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      const player = playerRef.current;
      const room = roomStateRef.current;

      if (player) {
        try {
          const time = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 1;

          if (!isSeekingRef.current) {
            setCurrentTime(time);
            setDuration(dur);
          }

          // Synced Lyrics Index Ticker
          const currentLyrics = lyricsRef.current;
          if (currentLyrics?.type === "synced" && Array.isArray(currentLyrics.lines)) {
            const activeIdx = currentLyrics.lines.findLastIndex((l) => l.time <= time + 0.15);
            if (activeIdx !== currentLineIndexRef.current) {
              setCurrentLineIndex(activeIdx);
            }
          }

          // A. Host Heartbeat: Transmit actual Host timestamp every 2 seconds
          if (isHostRef.current && room?.isPlaying && roomIdRef.current) {
            if (Date.now() - lastHostSyncEmitRef.current >= 2000) {
              lastHostSyncEmitRef.current = Date.now();
              socket.emit("sync-time", { roomId: roomIdRef.current, currentTime: time });
            }
          }

          // B. Smooth Cross-Device Sync Check: Auto-Correct Drift & Play State
          if (tickCount % 4 === 0 && room) {
            let expectedTime = room.currentTime || 0;
            if (room.isPlaying && room.lastUpdated) {
              expectedTime += (Date.now() - room.lastUpdated) / 1000;
            }

            const playerState = typeof player.getPlayerState === "function" ? player.getPlayerState() : -1;

            // Do not intervene if player is actively buffering (playerState 3)
            if (playerState !== 3) {
              // 1. Force Play state if room is playing but player is strictly paused, cued, or unstarted
              if (room.isPlaying && (playerState === 2 || playerState === 5 || playerState === 0 || playerState === -1)) {
                try { player.playVideo(); } catch (e) {}
              } else if (!room.isPlaying && playerState === 1) {
                try { player.pauseVideo(); } catch (e) {}
              }

              // 2. Smooth Auto-Seek ONLY if time drift exceeds 3.5s and 6s cooldown passed
              // (Eliminates continuous micro-jumping stuttering during normal playback)
              const timeDrift = Math.abs(time - expectedTime);
              const now = Date.now();
              if (
                room.isPlaying &&
                timeDrift > 3.5 &&
                !isSeekingRef.current &&
                now - lastAutoSeekRef.current > 6000
              ) {
                lastAutoSeekRef.current = now;
                try {
                  player.seekTo(expectedTime, true);
                } catch (e) {}
              }
            }
          }
        } catch (e) {
          // ignore transient player errors
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Handle Create Room (Instant 0ms entry - zero loading delay)
  const handleCreateRoom = useCallback(
    ({ roomId: newRoomId, passcode: newPasscode, username: uname, avatarColor: color }) => {
      const cleanRoom = (newRoomId || "").trim().toLowerCase();
      const cleanPass = (newPasscode || "").trim();
      const cleanName = (uname || "").trim() || username || `DJ-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanColor = color || avatarColor || "#8b5cf6";

      // 1. Immediately transition to room without delay
      setIsAuthLoading(false);
      setAuthError("");
      setRoomId(cleanRoom);
      setPasscode(cleanPass);
      setHasPasscode(Boolean(cleanPass));
      setUsername(cleanName);
      setAvatarColor(cleanColor);
      setIsHost(true);
      setInRoom(true);
      setViewMode("lounge");
      setIsCreateJoinModalOpen(false);

      // Seed immediate optimistic roomState so player, queue and lyrics never show a blank or loading state
      setRoomState({
        roomId: cleanRoom,
        trackTitle: "Lofi Chill Beats",
        artistName: "Lofi Girl",
        videoId: "jfKfPfyJRdk",
        thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60",
        isPlaying: false,
        currentTime: 0,
        users: [{ socketId: socket.id || "host", username: cleanName, isAdmin: true, isMainHost: true, avatarColor: cleanColor }],
        queue: [],
        requests: [],
        chatMessages: [{ id: `msg_${Date.now()}`, system: true, text: `👑 ${cleanName} created the room! Welcome to Musync.` }],
        isCurrentClientAdmin: true,
        isCurrentClientMainHost: true,
        hasPasscode: Boolean(cleanPass),
      });

      localStorage.setItem(
        "musync_active_room",
        JSON.stringify({
          roomId: cleanRoom,
          passcode: cleanPass,
          username: cleanName,
          avatarColor: cleanColor,
        })
      );

      const newUrl = `${window.location.pathname}?room=${encodeURIComponent(cleanRoom)}${
        cleanPass ? `&pass=${encodeURIComponent(cleanPass)}` : ""
      }`;
      window.history.pushState({}, "", newUrl);
      showToast(`🎉 Room "${cleanRoom}" created! You are the Host 👑`, "success");

      // 2. Register room on server via socket in background
      if (!socket.connected) {
        try { socket.connect(); } catch (e) {}
      }

      socket.emit("create-room", {
        roomId: cleanRoom,
        passcode: cleanPass,
        username: cleanName,
        avatarColor: cleanColor,
      });
    },
    [username, avatarColor, showToast]
  );

  // Handle Join Room (Instant 0ms entry - zero loading delay)
  const handleJoinRoom = useCallback(
    ({ roomId: targetRoomId, passcode: targetPasscode, username: uname, avatarColor: color }) => {
      const cleanRoom = (targetRoomId || "").trim().toLowerCase();
      const cleanPass = (targetPasscode || "").trim();
      const cleanName = (uname || "").trim() || username || `Listener-${Math.floor(100 + Math.random() * 900)}`;
      const cleanColor = color || avatarColor || "#8b5cf6";

      // 1. Immediately transition to room without delay
      setIsAuthLoading(false);
      setAuthError("");
      setRoomId(cleanRoom);
      setPasscode(cleanPass);
      setUsername(cleanName);
      setAvatarColor(cleanColor);
      setInRoom(true);
      setViewMode("lounge");
      setIsCreateJoinModalOpen(false);

      // Seed immediate optimistic roomState
      setRoomState((prev) => {
        if (prev && prev.roomId === cleanRoom) return prev;
        return {
          roomId: cleanRoom,
          trackTitle: "Lofi Chill Beats",
          artistName: "Lofi Girl",
          videoId: "jfKfPfyJRdk",
          thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60",
          isPlaying: false,
          currentTime: 0,
          users: [{ socketId: socket.id || "listener", username: cleanName, isAdmin: false, isMainHost: false, avatarColor: cleanColor }],
          queue: [],
          requests: [],
          chatMessages: [{ id: `msg_${Date.now()}`, system: true, text: `🎵 Joined room "${cleanRoom}"!` }],
          isCurrentClientAdmin: false,
          isCurrentClientMainHost: false,
          hasPasscode: Boolean(cleanPass),
        };
      });

      localStorage.setItem(
        "musync_active_room",
        JSON.stringify({
          roomId: cleanRoom,
          passcode: cleanPass,
          username: cleanName,
          avatarColor: cleanColor,
        })
      );

      const newUrl = `${window.location.pathname}?room=${encodeURIComponent(cleanRoom)}${
        cleanPass ? `&pass=${encodeURIComponent(cleanPass)}` : ""
      }`;
      window.history.pushState({}, "", newUrl);
      showToast(`🎵 Entering Room "${cleanRoom}"...`, "info");

      // 2. Synchronize with server in background
      if (!socket.connected) {
        try { socket.connect(); } catch (e) {}
      }

      socket.emit(
        "join-room",
        {
          roomId: cleanRoom,
          passcode: cleanPass,
          username: cleanName,
          avatarColor: cleanColor,
        },
        (res) => {
          if (res?.success) {
            setIsHost(Boolean(res.isAdmin));
            showToast(`🎵 Connected to Room "${res.roomId}"!`, "success");
          } else if (res?.requiresPasscode) {
            showToast(`🔒 Passcode required for "${cleanRoom}".`, "warning");
            setIsCreateJoinModalOpen(true);
          }
        }
      );
    },
    [username, avatarColor, showToast]
  );

const MASTER_SONGS_DATABASE = [
  { videoId: "vA83L5XN694", title: "Tauba Tauba", artist: "Karan Aujla", duration: "3:25", seconds: 205, thumbnail: "https://img.youtube.com/vi/vA83L5XN694/hqdefault.jpg" },
  { videoId: "eVli-tstM5E", title: "Espresso", artist: "Sabrina Carpenter", duration: "2:55", seconds: 175, thumbnail: "https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg" },
  { videoId: "V9PVRfjEBTI", title: "BIRDS OF A FEATHER", artist: "Billie Eilish", duration: "3:17", seconds: 197, thumbnail: "https://img.youtube.com/vi/V9PVRfjEBTI/hqdefault.jpg" },
  { videoId: "c183-W1s4h0", title: "Not Like Us", artist: "Kendrick Lamar", duration: "4:34", seconds: 274, thumbnail: "https://img.youtube.com/vi/c183-W1s4h0/hqdefault.jpg" },
  { videoId: "g6_tK0x_XwQ", title: "Husn", artist: "Anuv Jain", duration: "3:38", seconds: 218, thumbnail: "https://img.youtube.com/vi/g6_tK0x_XwQ/hqdefault.jpg" },
  { videoId: "yJg-Y5byMMw", title: "Big Dawgs", artist: "Hanumankind & Kalmi", duration: "3:53", seconds: 233, thumbnail: "https://img.youtube.com/vi/yJg-Y5byMMw/hqdefault.jpg" },
  { videoId: "BddP6PYo2gs", title: "Kesariya", artist: "Arijit Singh", duration: "4:28", seconds: 268, thumbnail: "https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg" },
  { videoId: "vK4s7p6vF7c", title: "Softly", artist: "Karan Aujla", duration: "2:35", seconds: 155, thumbnail: "https://img.youtube.com/vi/vK4s7p6vF7c/hqdefault.jpg" },
  { videoId: "D4hR_jZ1W_M", title: "Heeriye", artist: "Jasleen Royal & Arijit Singh", duration: "3:14", seconds: 194, thumbnail: "https://img.youtube.com/vi/D4hR_jZ1W_M/hqdefault.jpg" },
  { videoId: "FnT94P8P2z0", title: "Apna Bana Le", artist: "Arijit Singh", duration: "4:21", seconds: 261, thumbnail: "https://img.youtube.com/vi/FnT94P8P2z0/hqdefault.jpg" },
  { videoId: "g42C__pXl_g", title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", duration: "3:20", seconds: 200, thumbnail: "https://img.youtube.com/vi/g42C__pXl_g/hqdefault.jpg" },
  { videoId: "3yX_v9N6f7M", title: "Tu Aake Dekhle", artist: "King", duration: "4:40", seconds: 280, thumbnail: "https://img.youtube.com/vi/3yX_v9N6f7M/hqdefault.jpg" },
  { videoId: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", seconds: 200, thumbnail: "https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg" },
  { videoId: "TUVcZfQe-Kw", title: "Levitating", artist: "Dua Lipa", duration: "3:23", seconds: 203, thumbnail: "https://img.youtube.com/vi/TUVcZfQe-Kw/hqdefault.jpg" },
  { videoId: "H5v3kku4y6Q", title: "As It Was", artist: "Harry Styles", duration: "2:47", seconds: 167, thumbnail: "https://img.youtube.com/vi/H5v3kku4y6Q/hqdefault.jpg" },
  { videoId: "ic8j13gRBSQ", title: "Cruel Summer", artist: "Taylor Swift", duration: "2:58", seconds: 178, thumbnail: "https://img.youtube.com/vi/ic8j13gRBSQ/hqdefault.jpg" },
  { videoId: "RLzC55ai0eo", title: "vampire", artist: "Olivia Rodrigo", duration: "3:39", seconds: 219, thumbnail: "https://img.youtube.com/vi/RLzC55ai0eo/hqdefault.jpg" },
  { videoId: "jJPMnTXl63E", title: "death bed (coffee for your head)", artist: "Powfu", duration: "2:53", seconds: 173, thumbnail: "https://img.youtube.com/vi/jJPMnTXl63E/hqdefault.jpg" },
  { videoId: "h_D3VFfhvs4", title: "Lag Ja Gale Se Phir", artist: "Lata Mangeshkar", duration: "4:15", seconds: 255, thumbnail: "https://img.youtube.com/vi/h_D3VFfhvs4/hqdefault.jpg" },
  { videoId: "h53iJ8W68_4", title: "Pal Pal Dil Ke Pas", artist: "Kishore Kumar", duration: "5:25", seconds: 325, thumbnail: "https://img.youtube.com/vi/h53iJ8W68_4/hqdefault.jpg" },
  { videoId: "1w7OgIMMRc4", title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55", seconds: 355, thumbnail: "https://img.youtube.com/vi/1w7OgIMMRc4/hqdefault.jpg" },
  { videoId: "v8oqaSj4R3c", title: "Hotel California", artist: "Eagles", duration: "6:30", seconds: 390, thumbnail: "https://img.youtube.com/vi/v8oqaSj4R3c/hqdefault.jpg" },
  { videoId: "Zi_XLOBDo_Y", title: "Billie Jean", artist: "Michael Jackson", duration: "4:54", seconds: 294, thumbnail: "https://img.youtube.com/vi/Zi_XLOBDo_Y/hqdefault.jpg" },
  { videoId: "c2ZAC6v_4", title: "Tujhe Dekha To", artist: "Kumar Sanu", duration: "5:02", seconds: 302, thumbnail: "https://img.youtube.com/vi/c2ZAC6v_4/hqdefault.jpg" },
  { videoId: "gJliFHAbr6c", title: "Pehla Nasha", artist: "Udit Narayan", duration: "4:48", seconds: 288, thumbnail: "https://img.youtube.com/vi/gJliFHAbr6c/hqdefault.jpg" },
  { videoId: "hZvFGEE2HaU", title: "Smells Like Teen Spirit", artist: "Nirvana", duration: "4:38", seconds: 278, thumbnail: "https://img.youtube.com/vi/hZvFGEE2HaU/hqdefault.jpg" },
  { videoId: "4fndeDfaWCg", title: "I Want It That Way", artist: "Backstreet Boys", duration: "3:33", seconds: 213, thumbnail: "https://img.youtube.com/vi/4fndeDfaWCg/hqdefault.jpg" },
  { videoId: "7maJOI3QMu0", title: "River Flows in You", artist: "Yiruma", duration: "3:08", seconds: 188, thumbnail: "https://img.youtube.com/vi/7maJOI3QMu0/hqdefault.jpg" },
  { videoId: "kcihcYEOeic", title: "Nuvole Bianche", artist: "Ludovico Einaudi", duration: "5:58", seconds: 358, thumbnail: "https://img.youtube.com/vi/kcihcYEOeic/hqdefault.jpg" },
];

function performClientSearchFallback(query) {
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  const matches = MASTER_SONGS_DATABASE.filter((s) => {
    const title = s.title.toLowerCase();
    const artist = s.artist.toLowerCase();
    return tokens.some((token) => title.includes(token) || artist.includes(token));
  });

  if (matches.length > 0) return matches;
  return MASTER_SONGS_DATABASE.slice(0, 12);
}

  // Search music tracks
  const handleSearch = useCallback(
    async (query) => {
      if (!query || !query.trim()) return;
      const cleanKey = query.trim().toLowerCase();

      if (searchCacheRef.current[cleanKey]) {
        setSearchResults(searchCacheRef.current[cleanKey]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const activeBackend = BACKEND_URL && BACKEND_URL.startsWith("http")
          ? BACKEND_URL
          : "https://musync-ligw.onrender.com";

        const res = await fetch(`${activeBackend}/api/search?q=${encodeURIComponent(query)}`);
        const data = res.ok ? await res.json() : { results: [] };
        const results = data.results && data.results.length > 0
          ? data.results
          : performClientSearchFallback(query);

        searchCacheRef.current[cleanKey] = results;
        setSearchResults(results);
      } catch (err) {
        console.warn("Search network fallback triggered:", err);
        const fallbackResults = performClientSearchFallback(query);
        setSearchResults(fallbackResults);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Direct Play (Admin or Active User)
  const handlePlaySongDirect = useCallback(
    (song) => {
      if (!song || !song.videoId) return;

      const activeRoom = roomId || roomIdRef.current;
      const currentUname = username || usernameRef.current;
      const trackDur = song.seconds || song.durationSec || (song.duration ? 180 : 180);

      // 1. Immediately update optimistic state for 0ms response
      setRoomState((prev) => ({
        ...(prev || {}),
        videoId: song.videoId,
        trackTitle: song.title || "Selected Track",
        artistName: song.artist || "Artist",
        thumbnail: song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`,
        durationSec: trackDur,
        isPlaying: true,
        currentTime: 0,
      }));

      // 2. Direct player invocation inside user gesture stack to bypass browser autoplay blocks
      if (playerRef.current) {
        try {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
          if (typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById({
              videoId: song.videoId,
              startSeconds: 0,
            });
          }
          if (typeof playerRef.current.playVideo === "function") {
            playerRef.current.playVideo();
          }
        } catch (err) {
          console.warn("Direct play activation error:", err);
        }
      }

      // 3. Clear search results & notify
      setSearchResults([]);
      showToast(`▶ Now Playing: "${song.title}"`, "success");

      // 4. Fetch lyrics immediately
      const trackKey = `${song.title || ""}_${song.artist || ""}`;
      if (trackKey !== lastFetchedTrackRef.current) {
        lastFetchedTrackRef.current = trackKey;
        setIsLoadingLyrics(true);
        fetchLyrics(song.title, song.artist)
          .then((res) => {
            setLyrics(res);
            setCurrentLineIndex(-1);
          })
          .catch(() => setLyrics(null))
          .finally(() => setIsLoadingLyrics(false));
      }

      // 5. Emit to backend for multi-user sync
      if (activeRoom) {
        socket.emit("action", {
          roomId: activeRoom,
          username: currentUname,
          type: "CHANGE_TRACK",
          value: song.videoId,
          trackTitle: song.title,
          artistName: song.artist,
          thumbnail: song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`,
          durationSec: trackDur,
        });
      }
    },
    [roomId, username, volume, showToast]
  );

  // Request Song (Listener)
  const handleRequestSong = useCallback(
    (song) => {
      socket.emit("request-song", {
        roomId,
        song,
        requestedBy: username,
      });
      showToast(`Requested "${song.title}"! Sent to Host.`, "info");
    },
    [roomId, username, showToast]
  );

  // Add to Queue (Admin)
  const handleAddToQueue = useCallback(
    (song) => {
      socket.emit("add-to-queue", {
        roomId,
        song,
        requestedBy: username,
      });
    },
    [roomId, username]
  );

  // Accept Request (Admin)
  const handleAcceptRequest = useCallback(
    (requestId, playImmediately) => {
      socket.emit("accept-request", {
        roomId,
        requestId,
        playImmediately,
      });
    },
    [roomId]
  );

  // Reject Request (Admin)
  const handleRejectRequest = useCallback(
    (requestId) => {
      socket.emit("reject-request", {
        roomId,
        requestId,
      });
      showToast("Request declined", "info");
    },
    [roomId, showToast]
  );

  // Remove from Queue (Admin)
  const handleRemoveFromQueue = useCallback(
    (queueItemId) => {
      socket.emit("remove-from-queue", {
        roomId,
        queueItemId,
      });
    },
    [roomId]
  );

  // Play Specific Queue Item (Admin)
  const handlePlayQueueItem = useCallback(
    (queueItemId) => {
      const queueItem = roomState?.queue?.find((q) => q.id === queueItemId);
      if (queueItem) {
        handlePlaySongDirect(queueItem);
      }
      socket.emit("skip-track", {
        roomId,
        queueItemId,
      });
    },
    [roomId, roomState?.queue, handlePlaySongDirect]
  );

  // Skip Track (Admin)
  const handleSkipTrack = useCallback(() => {
    socket.emit("skip-track", { roomId });
  }, [roomId]);

  // Playback Controls
  const handleTogglePlay = useCallback(() => {
    const willPlay = !roomState?.isPlaying;
    const time = playerRef.current && typeof playerRef.current.getCurrentTime === "function"
      ? playerRef.current.getCurrentTime()
      : currentTime;

    if (playerRef.current) {
      try {
        if (willPlay) {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {}
    }

    setRoomState((prev) => ({
      ...(prev || {}),
      isPlaying: willPlay,
      currentTime: time,
    }));

    socket.emit("action", {
      roomId,
      username,
      type: willPlay ? "PLAY" : "PAUSE",
      value: time,
    });
  }, [roomId, username, roomState?.isPlaying, currentTime, volume]);

  const handleSeekChange = useCallback((e) => {
    setIsSeeking(true);
    setCurrentTime(parseFloat(e.target.value));
  }, []);

  const handleSeekCommit = useCallback(
    (e) => {
      const seekTo = parseFloat(e.target.value);
      setIsSeeking(false);
      if (playerRef.current) {
        playerRef.current.seekTo(seekTo, true);
      }
      socket.emit("action", { roomId, type: "SEEK", value: seekTo });
    },
    [roomId]
  );

  // Manual Re-sync for Listeners
  const handleManualResync = useCallback(() => {
    if (playerRef.current && roomState) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        playerRef.current.seekTo(roomState.currentTime || 0, true);
        if (roomState.isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {}
      showToast("🔄 Player re-synchronized with Host!", "success");
    }
  }, [roomState, volume, showToast]);

  // Volume Controls (Local)
  const handleVolumeChange = useCallback((newVol) => {
    setVolume(newVol);
    setIsMuted(false);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      playerRef.current.unMute();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMute = !prev;
      if (playerRef.current) {
        if (nextMute) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
      }
      return nextMute;
    });
  }, [volume]);

  // Fast Instant Chat (Optimistic 0ms Local Delivery + Background Socket Broadcast)
  const handleSendChat = useCallback(
    (text, replyTo = null, gifUrl = null) => {
      if ((!text || !text.trim()) && !gifUrl) return;
      const optimisticMsg = {
        id: `msg_opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        username,
        avatarColor,
        text: text ? text.trim() : "",
        gifUrl: gifUrl || null,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        replyTo: replyTo && replyTo.username ? { username: replyTo.username, text: replyTo.text || "GIF" } : null,
        optimistic: true,
      };

      // Instantly render in chat
      setChatMessages((prev) => [...prev, optimisticMsg]);

      // Emit to server
      socket.emit("send-chat", {
        roomId,
        text: text ? text.trim() : "",
        gifUrl: gifUrl || null,
        username,
        avatarColor,
        replyTo: replyTo && replyTo.username ? { username: replyTo.username, text: replyTo.text || "GIF" } : null,
      });
    },
    [roomId, username, avatarColor]
  );

  const handleSendReaction = useCallback(
    (emoji) => {
      socket.emit("send-reaction", {
        roomId,
        emoji,
        username,
      });
    },
    [roomId, username]
  );

  // Host Participant Management Actions
  const handleKickUser = useCallback(
    (user) => {
      socket.emit("kick-user", {
        roomId,
        targetSocketId: user.socketId,
        targetUsername: user.username,
      });
      showToast(`Removed @${user.username} from room`, "info");
    },
    [roomId, showToast]
  );

  const handleTransferHost = useCallback(
    (user) => {
      socket.emit("transfer-host", {
        roomId,
        targetSocketId: user.socketId,
      });
      showToast(`👑 Transferred Host role to @${user.username}!`, "success");
    },
    [roomId, showToast]
  );

  const handleToggleCoHost = useCallback(
    (targetUser) => {
      if (!roomId || !targetUser) return;
      socket.emit(
        "toggle-co-host",
        {
          roomId,
          targetUsername: targetUser.username,
        },
        (res) => {
          if (res?.success) {
            showToast(
              res.isCoHost
                ? `⭐ Promoted @${targetUser.username} to Co-Host!`
                : `Removed Co-Host role from @${targetUser.username}`,
              "success"
            );
          } else if (res?.message) {
            showToast(res.message, "error");
          }
        }
      );
    },
    [roomId, showToast]
  );

  const handleToggleMuteUser = useCallback(
    (user) => {
      socket.emit("toggle-mute-user", {
        roomId,
        targetSocketId: user.socketId,
      });
    },
    [roomId]
  );

  // Trigger Exit Room confirmation modal
  const handleLeaveRoom = useCallback(() => {
    setIsLeaveConfirmOpen(true);
  }, []);

  // Execute Leave Room after user confirmation
  const confirmLeaveRoom = useCallback(() => {
    setIsLeaveConfirmOpen(false);
    localStorage.removeItem("musync_active_room");
    if (roomId) {
      socket.emit("leave-room", { roomId });
    }
    setInRoom(false);
    setRoomState(null);
    setRoomId("");
    setPasscode("");
    setViewMode("dashboard");
    window.history.pushState({}, "", window.location.pathname);
    showToast("Left room and returned to Dashboard", "info");
  }, [roomId, showToast]);

  // Auto-advance song when video finishes (if Host)
  const handleVideoEnded = useCallback(() => {
    if (isHost && roomState?.queue?.length > 0) {
      handleSkipTrack();
    }
  }, [isHost, roomState?.queue?.length, handleSkipTrack]);

  // Saved Auth User Restoration
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem("musync_user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.username) {
          setUser(parsed);
          setUsername(parsed.username);
          if (parsed.avatarColor) setAvatarColor(parsed.avatarColor);
        }
      }
    } catch (e) {}
  }, []);

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    setUsername(authUser.username);
    setAvatarColor(authUser.avatarColor || "#8b5cf6");
    localStorage.setItem("musync_user", JSON.stringify(authUser));
    showToast(`🎉 Welcome, ${authUser.username}!`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("musync_user");
    showToast("Logged out of account.", "info");
  };

  // Handle YouTube Player Error
  const handlePlayerError = useCallback(
    (e) => {
      const code = e?.data;
      console.warn("YouTube player error:", code);
      if (code === 150 || code === 101) {
        showToast("⚠️ Track has embed restrictions on YouTube. Playing next track...", "warning");
        if (isHost && roomState?.queue?.length > 0) {
          handleSkipTrack();
        }
      } else if (code === 100 || code === 2) {
        showToast("⚠️ Video not available. Skipping...", "warning");
        if (isHost && roomState?.queue?.length > 0) {
          handleSkipTrack();
        }
      }
    },
    [isHost, roomState?.queue?.length, handleSkipTrack, showToast]
  );

  const handleHostSongDirect = (song) => {
    const newRoomId = `room_${Math.floor(1000 + Math.random() * 9000)}`;
    const myName = user?.username || username || `Host-${Math.floor(100 + Math.random() * 900)}`;
    const myColor = user?.avatarColor || avatarColor || "#8b5cf6";

    handleCreateRoom({
      roomId: newRoomId,
      passcode: "",
      username: myName,
      avatarColor: myColor,
    });

    setTimeout(() => {
      handlePlaySongDirect(song);
      setViewMode("lounge");
    }, 200);
  };

  // Is current user muted by host?
  const isCurrentUserMuted = Boolean(
    roomState?.users?.find((u) => u.username === username)?.isMuted
  );

  return (
    <div className="musync-app-root">
      {/* Background Silent Audio Keep-Alive Stream for Mobile Browser Tab Persistence */}
      <audio
        ref={bgAudioRef}
        loop
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        style={{ display: "none" }}
      />

      {/* Musync Audio Engine */}
      <div className="hidden-youtube-engine">
        <YouTube
          videoId={roomState?.videoId || "jfKfPfyJRdk"}
          opts={{
            height: "200",
            width: "200",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              playsinline: 1,
              enablejsapi: 1,
              fs: 0,
              rel: 0,
              origin: typeof window !== "undefined" ? window.location.origin : undefined,
            },
          }}
          onReady={(e) => {
            playerRef.current = e.target;
            try {
              playerRef.current.unMute();
              playerRef.current.setVolume(volume);
              if (roomState?.isPlaying) {
                playerRef.current.playVideo();
              }
            } catch (err) {}
          }}
          onStateChange={(e) => {
            if (e.data === 1 && playerRef.current) {
              try {
                if (!isMuted) {
                  playerRef.current.unMute();
                  playerRef.current.setVolume(volume);
                }
              } catch (err) {}
            }
          }}
          onError={handlePlayerError}
          onEnd={handleVideoEnded}
        />
      </div>

      {/* Ambient Cosmic Background Glow Mesh */}
      <div className="musync-ambient-glow" aria-hidden="true">
        <div className="glow-orb-1"></div>
        <div className="glow-orb-2"></div>
        <div className="glow-orb-3"></div>
      </div>

      {/* Floating Reaction Emojis Overlay */}
      <FloatingReactions reactions={reactions} />

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* Header Bar */}
      <Header
        roomId={roomId}
        hasPasscode={hasPasscode}
        passcode={passcode}
        isHost={isHost}
        username={username}
        avatarColor={avatarColor}
        users={roomState?.users || []}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenParticipantsModal={() => setIsParticipantsModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        showToast={showToast}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === "lounge" ? "dashboard" : "lounge")}
        onOpenNicknameModal={() => setIsNicknameModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Nickname Selection Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        currentUsername={username}
        currentAvatarColor={avatarColor}
        onSave={({ username: newName, avatarColor: newColor }) => {
          setUsername(newName);
          setAvatarColor(newColor);
          showToast(`✨ Welcome, @${newName}!`, "success");
        }}
      />

      {/* View Switcher: Dashboard View vs Lounge View */}
      {viewMode === "dashboard" || !inRoom ? (
        <DashboardView
          username={username}
          avatarColor={avatarColor}
          onCreateRoom={() => setIsCreateJoinModalOpen(true)}
          onJoinRoom={(rId, hasPass) => {
            if (hasPass) {
              setInitialUrlRoomId(rId);
              setIsCreateJoinModalOpen(true);
            } else {
              handleJoinRoom({
                roomId: rId,
                passcode: "",
                username: username || `Listener-${Math.floor(100 + Math.random() * 900)}`,
                avatarColor: avatarColor || "#8b5cf6",
              });
              setViewMode("lounge");
            }
          }}
          onHostSongDirect={handleHostSongDirect}
          onReturnToLounge={() => setViewMode("lounge")}
          inRoom={inRoom}
          currentRoomId={roomId}
          backendUrl={BACKEND_URL}
        />
      ) : (
        /* Main Multi-Panel Music Lounge Layout */
        <main className={`musync-main-grid mobile-tab-${activeMobileTab}`}>
          {/* Left Column: Live Synced Lyrics & Turntable Player */}
          <section className="grid-col-lyrics">
            <LyricsPanel
              lyrics={lyrics}
              isLoadingLyrics={isLoadingLyrics}
              currentLineIndex={currentLineIndex}
              onLineClick={(time) => {
                if (isHost && playerRef.current) {
                  playerRef.current.seekTo(time, true);
                  socket.emit("action", { roomId, type: "SEEK", value: time });
                }
              }}
              isHost={isHost}
              trackTitle={roomState?.trackTitle}
              artistName={roomState?.artistName}
              roomState={roomState}
              currentTime={currentTime}
              duration={duration}
              isSeeking={isSeeking}
              onSeekChange={handleSeekChange}
              onSeekCommit={handleSeekCommit}
              onTogglePlay={handleTogglePlay}
              onSkipTrack={handleSkipTrack}
              onManualResync={handleManualResync}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
            />
          </section>

          {/* Center Column: Up Next 3D CoverFlow & Collaborative Queue */}
          <section className="grid-col-queue">
            <CenterQueuePanel
              queue={roomState?.queue || []}
              roomState={roomState}
              isHost={isHost}
              onPlaySongDirect={handlePlaySongDirect}
              onAddToQueue={handleAddToQueue}
              onRemoveFromQueue={handleRemoveFromQueue}
              onPlayQueueItem={handlePlayQueueItem}
            />
          </section>

          {/* Rightmost Column: Search, Requests, Chat & Participants */}
          <section className="grid-col-sidebar">
            <QueueAndRequests
              roomId={roomId}
              isHost={isHost}
              username={username}
              avatarColor={avatarColor}
              users={roomState?.users || []}
              isMuted={isCurrentUserMuted}
              queue={roomState?.queue || []}
              requests={roomState?.requests || []}
              chatMessages={chatMessages}
              onSearch={handleSearch}
              searchResults={searchResults}
              isSearching={isSearching}
              onClearSearch={() => setSearchResults([])}
              onRequestSong={handleRequestSong}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onAddToQueue={handleAddToQueue}
              onRemoveFromQueue={handleRemoveFromQueue}
              onPlayQueueItem={handlePlayQueueItem}
              onPlaySongDirect={handlePlaySongDirect}
              onSendChat={handleSendChat}
              onSendReaction={handleSendReaction}
              onKickUser={handleKickUser}
              onTransferHost={handleTransferHost}
              onToggleMuteUser={handleToggleMuteUser}
              isMainHost={isMainHost}
              onToggleCoHost={handleToggleCoHost}
            />
          </section>
        </main>
      )}

      {/* Manual Create / Join Modal */}
      {isCreateJoinModalOpen && (
        <CreateJoinModal
          initialRoomId={initialUrlRoomId}
          initialPasscode={initialUrlPasscode}
          onCreateRoom={(data) => {
            handleCreateRoom(data);
          }}
          onJoinRoom={(data) => {
            handleJoinRoom(data);
          }}
          isLoading={isAuthLoading}
          errorMessage={authError}
          clearError={() => setAuthError("")}
          onClose={() => setIsCreateJoinModalOpen(false)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* Bottom Mobile Tab Bar for Phones (<= 768px) - Render ONLY inside active room */}
      {inRoom && viewMode === "lounge" && (
        <MobileNav
          activeTab={activeMobileTab}
          onTabChange={setActiveMobileTab}
          isPlaying={Boolean(roomState?.isPlaying)}
          requestsCount={roomState?.requests?.length || 0}
          hasUnreadChat={hasUnreadMobileChat}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* Share Room Invitation Modal */}
      <ShareModal
        roomId={roomId}
        passcode={passcode}
        hasPasscode={hasPasscode}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        showToast={showToast}
      />

      {/* Exit Room Confirmation Modal */}
      <LeaveConfirmModal
        isOpen={isLeaveConfirmOpen}
        onClose={() => setIsLeaveConfirmOpen(false)}
        onConfirm={confirmLeaveRoom}
        roomId={roomId}
      />

      {/* Participants & Host Moderation Modal */}
      <ParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        users={roomState?.users || []}
        isHost={isHost}
        currentSocketId={socket.id}
        currentUsername={username}
        onKickUser={handleKickUser}
        onTransferHost={handleTransferHost}
        onToggleMuteUser={handleToggleMuteUser}
      />
    </div>
  );
}