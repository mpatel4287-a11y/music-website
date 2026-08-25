import React, { useState, useEffect, useRef, useCallback } from "react";
import YouTube from "react-youtube";
import io from "socket.io-client";
import { fetchLyrics } from "./lyricsHelper";

import CreateJoinModal from "./components/CreateJoinModal";
import Header from "./components/Header";
import PlayerPanel from "./components/PlayerPanel";
import LyricsPanel from "./components/LyricsPanel";
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
  // Production fallback to active Railway backend URL
  return "https://music-website-production.up.railway.app";
};

const BACKEND_URL = getBackendUrl();

const socket = io(BACKEND_URL || undefined, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 10,
  autoConnect: true,
});

export default function App() {
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

  // Mobile Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState("player");

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

  // Sync refs with state
  lyricsRef.current = lyrics;
  currentLineIndexRef.current = currentLineIndex;
  isSeekingRef.current = isSeeking;
  roomStateRef.current = roomState;
  isHostRef.current = isHost;
  roomIdRef.current = roomId;

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

  // 1. Detect URL invite query params (?room=XYZ&pass=123) & Session Auto-Rejoin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    const passParam = params.get("pass");

    if (roomParam) {
      setInitialUrlRoomId(roomParam);
      setRoomId(roomParam);
    }
    if (passParam) {
      setInitialUrlPasscode(passParam);
      setPasscode(passParam);
    }

    // Auto Rejoin saved room session if page reloaded
    try {
      const savedSessionStr = localStorage.getItem("musync_active_room");
      if (savedSessionStr) {
        const savedSession = JSON.parse(savedSessionStr);
        if (savedSession?.roomId) {
          const targetRoom = roomParam || savedSession.roomId;
          const targetPass = passParam || savedSession.passcode || "";
          const targetUser = savedSession.username || "";
          const targetColor = savedSession.avatarColor || "#8b5cf6";

          if (targetRoom && targetUser) {
            setIsAuthLoading(true);
            socket.emit(
              "join-room",
              {
                roomId: targetRoom,
                passcode: targetPass,
                username: targetUser,
                avatarColor: targetColor,
              },
              (res) => {
                setIsAuthLoading(false);
                if (res?.success) {
                  setRoomId(res.roomId);
                  setPasscode(targetPass);
                  setUsername(targetUser);
                  setAvatarColor(targetColor);
                  setIsHost(Boolean(res.isAdmin));
                  setInRoom(true);
                }
              }
            );
          }
        }
      }
    } catch (err) {
      console.error("Auto rejoin error:", err);
    }
  }, []);

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

  // 2. Setup Socket Listeners
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to Musync socket server:", socket.id);
    });

    socket.on("sync-state", (state) => {
      if (!state) return;
      setRoomState(state);
      setIsHost(Boolean(state.isCurrentClientAdmin));
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
          const currentUrl = player.getVideoUrl() || "";
          const localTime = player.getCurrentTime() || 0;

          if (!currentUrl.includes(state.videoId)) {
            player.loadVideoById({
              videoId: state.videoId,
              startSeconds: state.currentTime || 0,
            });
          } else if (Math.abs(localTime - state.currentTime) > 2.0) {
            player.seekTo(state.currentTime, true);
          }

          if (state.isPlaying) {
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

  // Handle Create Room
  const handleCreateRoom = useCallback(
    ({ roomId: newRoomId, passcode: newPasscode, username: uname, avatarColor: color }) => {
      setIsAuthLoading(true);
      setAuthError("");

      socket.emit(
        "create-room",
        {
          roomId: newRoomId,
          passcode: newPasscode,
          username: uname,
          avatarColor: color,
        },
        (res) => {
          setIsAuthLoading(false);
          if (res?.success) {
            setRoomId(res.roomId);
            setPasscode(res.passcode || newPasscode || "");
            setHasPasscode(Boolean(newPasscode));
            setUsername(uname);
            setAvatarColor(color);
            setIsHost(true);
            setInRoom(true);

            localStorage.setItem(
              "musync_active_room",
              JSON.stringify({
                roomId: res.roomId,
                passcode: res.passcode || newPasscode || "",
                username: uname,
                avatarColor: color,
              })
            );

            const newUrl = `${window.location.pathname}?room=${encodeURIComponent(res.roomId)}${
              newPasscode ? `&pass=${encodeURIComponent(newPasscode)}` : ""
            }`;
            window.history.pushState({}, "", newUrl);
            showToast(`🎉 Room "${res.roomId}" created! You are the Host 👑`, "success");
          } else {
            setAuthError(res?.message || "Failed to create room. Please try again.");
          }
        }
      );
    },
    [showToast]
  );

  // Handle Join Room
  const handleJoinRoom = useCallback(
    ({ roomId: targetRoomId, passcode: targetPasscode, username: uname, avatarColor: color }) => {
      setIsAuthLoading(true);
      setAuthError("");

      socket.emit(
        "join-room",
        {
          roomId: targetRoomId,
          passcode: targetPasscode,
          username: uname,
          avatarColor: color,
        },
        (res) => {
          setIsAuthLoading(false);
          if (res?.success) {
            setRoomId(res.roomId);
            setPasscode(targetPasscode || "");
            setUsername(uname);
            setAvatarColor(color);
            setIsHost(Boolean(res.isAdmin));
            setInRoom(true);

            localStorage.setItem(
              "musync_active_room",
              JSON.stringify({
                roomId: res.roomId,
                passcode: targetPasscode || "",
                username: uname,
                avatarColor: color,
              })
            );

            const newUrl = `${window.location.pathname}?room=${encodeURIComponent(res.roomId)}${
              targetPasscode ? `&pass=${encodeURIComponent(targetPasscode)}` : ""
            }`;
            window.history.pushState({}, "", newUrl);
            showToast(`🎵 Connected to Room "${res.roomId}"!`, "success");
          } else {
            setAuthError(res?.message || "Failed to join room.");
          }
        }
      );
    },
    [showToast]
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
        const res = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
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

  // Direct Play (Admin)
  const handlePlaySongDirect = useCallback(
    (song) => {
      socket.emit("action", {
        roomId,
        type: "CHANGE_TRACK",
        value: song.videoId,
        trackTitle: song.title,
        artistName: song.artist,
        thumbnail: song.thumbnail,
        durationSec: song.seconds,
      });
      setSearchResults([]);
    },
    [roomId]
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
      socket.emit("skip-track", {
        roomId,
        queueItemId,
      });
    },
    [roomId]
  );

  // Skip Track (Admin)
  const handleSkipTrack = useCallback(() => {
    socket.emit("skip-track", { roomId });
  }, [roomId]);

  // Playback Controls
  const handleTogglePlay = useCallback(() => {
    const time = playerRef.current ? playerRef.current.getCurrentTime() : currentTime;
    socket.emit("action", {
      roomId,
      type: roomState?.isPlaying ? "PAUSE" : "PLAY",
      value: time,
    });
  }, [roomId, roomState?.isPlaying, currentTime]);

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
      playerRef.current.seekTo(roomState.currentTime || 0, true);
      if (roomState.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
      showToast("🔄 Player re-synchronized with Host!", "success");
    }
  }, [roomState, showToast]);

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
    (text) => {
      if (!text || !text.trim()) return;
      const optimisticMsg = {
        id: `msg_opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        username,
        avatarColor,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        optimistic: true,
      };

      // Instantly render in chat
      setChatMessages((prev) => [...prev, optimisticMsg]);

      // Emit to server
      socket.emit("send-chat", {
        roomId,
        text: text.trim(),
        username,
        avatarColor,
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
      socket.emit("add-to-queue", {
        roomId: newRoomId,
        song: {
          videoId: song.videoId,
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail,
          duration: song.duration,
          seconds: song.seconds || 200,
        },
      });
      setViewMode("lounge");
    }, 400);
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

      {/* Invisible Musync Audio Engine */}
      <div className="hidden-youtube-engine">
        <YouTube
          videoId={roomState?.videoId || "jfKfPfyJRdk"}
          opts={{
            height: "1",
            width: "1",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin,
            },
          }}
          onReady={(e) => {
            playerRef.current = e.target;
            playerRef.current.setVolume(volume);
            if (roomState?.isPlaying) {
              try {
                playerRef.current.playVideo();
              } catch (err) {}
            }
          }}
          onEnd={handleVideoEnded}
        />
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
          inRoom={inRoom}
          currentRoomId={roomId}
          backendUrl={BACKEND_URL}
        />
      ) : (
        /* Main Multi-Panel Music Lounge Layout */
        <main className={`musync-main-grid mobile-tab-${activeMobileTab}`}>
          {/* Left Column: Player, Vinyl, Visualizer, Controls */}
          <section className="grid-col-player">
            <PlayerPanel
              roomState={roomState}
              isHost={isHost}
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

          {/* Center Column: Live Synced Lyrics */}
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
            />
          </section>

          {/* Rightmost Column: Search, Queue, Requests, Chat & Participants */}
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
            setIsCreateJoinModalOpen(false);
            setViewMode("lounge");
          }}
          onJoinRoom={(data) => {
            handleJoinRoom(data);
            setIsCreateJoinModalOpen(false);
            setViewMode("lounge");
          }}
          isLoading={isAuthLoading}
          errorMessage={authError}
          clearError={() => setAuthError("")}
          onClose={() => setIsCreateJoinModalOpen(false)}
        />
      )}

      {/* Bottom Mobile Tab Bar for Phones (<= 768px) - Render ONLY inside active room */}
      {inRoom && viewMode === "lounge" && (
        <MobileNav
          activeTab={activeMobileTab}
          onTabChange={setActiveMobileTab}
          isPlaying={Boolean(roomState?.isPlaying)}
          requestsCount={roomState?.requests?.length || 0}
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