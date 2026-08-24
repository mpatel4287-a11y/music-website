const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const ytSearch = require("yt-search");
const bcrypt = require("bcryptjs");

// Prevent server process crashes from unhandled errors or rejection
process.on("uncaughtException", (err) => {
  console.error("⚠️ Global Uncaught Exception (prevented crash):", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Global Unhandled Rejection (prevented crash):", reason?.message || reason);
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-Memory Search Cache (Map: query -> { timestamp, results })
const searchCache = new Map();
const SEARCH_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Music Search Endpoint via yt-search (Cached for High Performance)
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const cleanKey = query.trim().toLowerCase();
  const cached = searchCache.get(cleanKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return res.json({ results: cached.results, cached: true });
  }

  try {
    const r = await ytSearch(query);
    const videos = r.videos ? r.videos.slice(0, 15) : [];

    const results = videos.map((v) => ({
      videoId: v.videoId,
      title: v.title || "Unknown Title",
      artist: v.author?.name || "Unknown Artist",
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      duration: v.timestamp || "3:00",
      seconds: v.seconds || 180,
    }));

    searchCache.set(cleanKey, { timestamp: Date.now(), results });
    res.json({ results });
  } catch (error) {
    console.error("Search error:", error.message);
    if (cached) {
      return res.json({ results: cached.results, fallback: true });
    }
    res.status(500).json({ error: "Failed to fetch YouTube search results", details: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    roomsCount: Object.keys(rooms).length,
    timestamp: Date.now(),
  });
});

// JSON User Store Management
const fs = require("fs");
const path = require("path");
const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading users:", err);
    return [];
  }
}

function saveUsers(users) {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving users:", err);
  }
}

// 1. Auth Register Endpoint with Bcrypt Hashing & Location
app.post("/api/auth/register", async (req, res) => {
  const { email, password, username, avatarColor, musicGenres, location } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ success: false, message: "Email, password, and display name are required." });
  }

  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (users.find((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, message: "An account with this email already exists." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      email: cleanEmail,
      password: hashedPassword,
      username: username.trim(),
      avatarColor: avatarColor || "#8b5cf6",
      musicGenres: Array.isArray(musicGenres) && musicGenres.length > 0 ? musicGenres : ["lofi", "pop"],
      location: location || null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser, token: `token_${safeUser.id}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration error: " + err.message });
  }
});

// 2. Auth Login Endpoint with Bcrypt Password Check
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  try {
    let isValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      isValid = user.password === password; // Plain-text legacy check
      if (isValid) {
        user.password = await bcrypt.hash(password, 10); // Upgrade to bcrypt
        saveUsers(users);
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: `token_${safeUser.id}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login verification failed." });
  }
});

// 3. Update User Preferences (Music Tastes & Location)
app.post("/api/auth/preferences", (req, res) => {
  const { email, musicGenres, location, avatarColor, username } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  const users = getUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (index < 0) return res.status(404).json({ success: false, message: "User not found" });

  if (musicGenres) users[index].musicGenres = musicGenres;
  if (location) users[index].location = location;
  if (avatarColor) users[index].avatarColor = avatarColor;
  if (username) users[index].username = username;

  saveUsers(users);
  const { password: _, ...safeUser } = users[index];
  res.json({ success: true, user: safeUser });
});

// 4. Auth Reset Password Endpoint
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: "Email and new password are required." });
  }

  if (newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, message: "Password must be at least 4 characters long." });
  }

  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (index < 0) {
    return res.status(404).json({ success: false, message: "No account registered with this email address." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[index].password = hashedPassword;
    saveUsers(users);

    res.json({ success: true, message: "Password reset successful! You can now log in with your new password." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password reset failed: " + err.message });
  }
});


// 4. Get Active Public & Protected Rooms with Location Meta
app.get("/api/rooms", (req, res) => {
  const activeRoomsList = Object.values(rooms).map((r) => ({
    roomId: r.roomId,
    location: r.location || "Global Lounge",
    genre: r.genre || "Lofi & Chill",
    hasPasscode: Boolean(r.passcode && r.passcode.trim().length > 0),
    listenersCount: r.users ? r.users.length : 0,
    adminUsername: r.adminUsername,
    trackTitle: r.trackTitle,
    artistName: r.artistName,
    thumbnail: r.thumbnail,
    isPlaying: r.isPlaying,
  }));

  res.json({ rooms: activeRoomsList });
});

// Specific single song queries per category to guarantee single tracks (2-5 mins)
const SINGLE_SONG_QUERIES = {
  classic: [
    "Lag Ja Gale Lata Mangeshkar",
    "Pal Pal Dil Ke Pas Kishore Kumar",
    "Tere Bina Zindagi Se Koi Kishore Kumar",
    "Gulabi Aankhen Mohammed Rafi",
    "Chupke Chupke Raat Din Ghulam Ali",
    "Queen Bohemian Rhapsody",
    "Eagles Hotel California",
    "Michael Jackson Billie Jean",
    "Frank Sinatra Fly Me To The Moon",
    "Elvis Presley Can't Help Falling in Love",
  ],
  "90s": [
    "Tujhe Dekha To Yeh Jaana Sanam Kumar Sanu",
    "Pehla Nasha Udit Narayan",
    "Dil To Pagal Hai Udit Narayan",
    "Nirvana Smells Like Teen Spirit",
    "Backstreet Boys I Want It That Way",
    "Britney Spears Baby One More Time",
    "Chaiyya Chaiyya Sukhwinder Singh",
    "Kaho Naa Pyaar Hai Udit Narayan",
    "Spice Girls Wannabe",
    "Sonu Nigam Deewana Tera",
  ],
  new: [
    "Sabrina Carpenter Espresso",
    "Billie Eilish BIRDS OF A FEATHER",
    "Chaleya Arijit Singh",
    "Tauba Tauba Karan Aujla",
    "Hozier Too Sweet",
    "Kendrick Lamar Not Like Us",
    "Post Malone Morgan Wallen I Had Some Help",
    "Husn Anuv Jain",
    "Jasleen Royal Heeriye",
    "Dua Lipa Houdini",
  ],
  instrumental: [
    "Yiruma River Flows in You",
    "Ludovico Einaudi Nuvole Bianche",
    "AR Rahman Instrumental Violin",
    "Hans Zimmer Time Inception",
    "Kenny G Loving You Saxophone",
    "Zakir Hussain Tabla Solo",
    "Interstellar Main Theme Hans Zimmer Piano",
    "Secret Garden Song from a Secret Garden",
    "Turkish March Mozart Piano",
    "Brian Crain Butterfly Waltz",
  ],
  modern: [
    "The Weeknd Blinding Lights",
    "Dua Lipa Levitating",
    "Harry Styles As It Was",
    "Taylor Swift Cruel Summer",
    "Olivia Rodrigo vampire",
    "Arijit Singh Apna Bana Le",
    "Karan Aujla Softly",
    "Jasleen Royal Heeriye",
    "King Tu Aake Dekhle",
    "Badshah Soulmate Arijit Singh",
  ],
  all: [
    "Kesariya Arijit Singh",
    "Sabrina Carpenter Espresso",
    "Tauba Tauba Karan Aujla",
    "Billie Eilish BIRDS OF A FEATHER",
    "The Weeknd Blinding Lights",
    "Apna Bana Le Arijit Singh",
    "Kendrick Lamar Not Like Us",
    "Chaleya Arijit Singh",
    "Harry Styles As It Was",
    "Dua Lipa Levitating",
  ],
  india: [
    "Kesariya Arijit Singh",
    "Tauba Tauba Karan Aujla",
    "Apna Bana Le Arijit Singh",
    "Chaleya Arijit Singh",
    "Husn Anuv Jain",
    "Softly Karan Aujla",
    "Tum Se Raghav Chaitanya",
    "Satranga Arijit Singh ANIMAL",
    "Pehle Bhi Main Vishal Mishra",
    "Heeriye Jasleen Royal Arijit Singh",
  ],
  lofi: [
    "Powfu death bed coffee for your head",
    "j'san french inhale",
    "Kina get you the moon",
    "Kina Can We Kiss Forever",
    "Zaeden Tere Bina Lofi",
    "Arijit Singh Lofi Chill Single",
    "Kavita Seth Iktara Lofi",
    "Shiloh Dynasty I Know You So Well",
    "Sarcastic Sounds It's OK to Cry",
    "C4C Melancholy Lofi",
  ],
  pop: [
    "Sabrina Carpenter Espresso",
    "Billie Eilish BIRDS OF A FEATHER",
    "The Weeknd Blinding Lights",
    "Harry Styles As It Was",
    "Dua Lipa Levitating",
    "Taylor Swift Cruel Summer",
    "Post Malone Sunflower",
    "Olivia Rodrigo vampire",
  ],
  hiphop: [
    "Kendrick Lamar Not Like Us",
    "Travis Scott FE!N Playboi Carti",
    "Softly Karan Aujla",
    "Drake Passionfruit",
    "Post Malone Sunflower",
    "Jack Harlow Lovin On Me",
  ],
  bollywood: [
    "Kesariya Arijit Singh",
    "Tauba Tauba Karan Aujla",
    "Apna Bana Le Arijit Singh",
    "Chaleya Arijit Singh",
    "Husn Anuv Jain",
    "Tum Se Raghav Chaitanya",
    "Satranga Arijit Singh",
    "Pehle Bhi Main Vishal Mishra",
  ],
  edm: [
    "David Guetta Bebe Rexha I'm Good Blue",
    "Calvin Harris Ellie Goulding Miracle",
    "Tiesto The Business",
    "The Chainsmokers Halsey Closer",
    "Martin Garrix Animals",
  ],
  rock: [
    "Arctic Monkeys Do I Wanna Know",
    "The Neighbourhood Sweater Weather",
    "Hozier Too Sweet",
  ],
  jazz: [
    "Norah Jones Don't Know Why",
    "Laufey From The Start",
  ],
};

const CURATED_SINGLE_SONGS = {
  classic: [
    { videoId: "h_D3VFfhvs4", title: "Lag Ja Gale Se Phir", artist: "Lata Mangeshkar", duration: "4:15", seconds: 255 },
    { videoId: "h53iJ8W68_4", title: "Pal Pal Dil Ke Pas", artist: "Kishore Kumar", duration: "5:25", seconds: 325 },
    { videoId: "1w7OgIMMRc4", title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55", seconds: 355 },
  ],
  "90s": [
    { videoId: "c2ZAC6v_4", title: "Tujhe Dekha To", artist: "Kumar Sanu & Lata Mangeshkar", duration: "5:02", seconds: 302 },
    { videoId: "gJliFHAbr6c", title: "Pehla Nasha", artist: "Udit Narayan & Sadhana Sargam", duration: "4:48", seconds: 288 },
  ],
  new: [
    { videoId: "eVli-tstM5E", title: "Espresso", artist: "Sabrina Carpenter", duration: "2:55", seconds: 175 },
    { videoId: "V9PVRfjEBTI", title: "BIRDS OF A FEATHER", artist: "Billie Eilish", duration: "3:17", seconds: 197 },
  ],
  instrumental: [
    { videoId: "7maJOI3QMu0", title: "River Flows in You", artist: "Yiruma", duration: "3:08", seconds: 188 },
    { videoId: "kcihcYEOeic", title: "Nuvole Bianche", artist: "Ludovico Einaudi", duration: "5:58", seconds: 358 },
  ],
  modern: [
    { videoId: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", seconds: 200 },
    { videoId: "TUVcZfQe-Kw", title: "Levitating", artist: "Dua Lipa", duration: "3:23", seconds: 203 },
  ],
  all: [
    { videoId: "BddP6PYo2gs", title: "Kesariya", artist: "Arijit Singh", duration: "4:28", seconds: 268 },
    { videoId: "eVli-tstM5E", title: "Espresso", artist: "Sabrina Carpenter", duration: "2:55", seconds: 175 },
  ],
  india: [
    { videoId: "BddP6PYo2gs", title: "Kesariya", artist: "Arijit Singh", duration: "4:28", seconds: 268 },
    { videoId: "vA83L5XN694", title: "Tauba Tauba", artist: "Karan Aujla", duration: "3:25", seconds: 205 },
  ],
  lofi: [
    { videoId: "jJPMnTXl63E", title: "death bed (coffee for your head)", artist: "Powfu ft. beabadoobee", duration: "2:53", seconds: 173 },
  ],
};

// High-Speed Recommendations Cache Map (genre -> { timestamp, items })
const recommendationsCache = {};
const RECS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCuratedFallback(category) {
  const curated = CURATED_SINGLE_SONGS[category] || CURATED_SINGLE_SONGS.all;
  return curated.map((item) => ({
    ...item,
    thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
    genre: category,
    isSingleTrack: true,
  }));
}

async function refreshCategoryRecommendations(targetCategory) {
  const queries = SINGLE_SONG_QUERIES[targetCategory] || SINGLE_SONG_QUERIES.all;
  try {
    const searchPromises = queries.slice(0, 8).map(async (query) => {
      try {
        const r = await ytSearch(query);
        const videos = r.videos || [];
        const match = videos.find((v) => {
          const sec = v.seconds || 0;
          if (sec < 90 || sec > 330) return false;
          const title = (v.title || "").toLowerCase();
          return (
            !title.includes("compilation") &&
            !title.includes("hours") &&
            !title.includes("full album") &&
            !title.includes("jukebox") &&
            !title.includes("relaxing")
          );
        });

        if (match) {
          return {
            videoId: match.videoId,
            title: match.title,
            artist: match.author?.name || "Single Track",
            thumbnail: match.thumbnail || `https://img.youtube.com/vi/${match.videoId}/hqdefault.jpg`,
            duration: match.timestamp || "3:30",
            seconds: match.seconds || 210,
            genre: targetCategory,
            isSingleTrack: true,
          };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    const valid = results.filter(Boolean);
    if (valid.length >= 2) {
      recommendationsCache[targetCategory] = {
        timestamp: Date.now(),
        items: valid,
      };
    }
  } catch (e) {
    // Ignore background refresh errors
  }
}

// Pre-seed recommendations cache with curated songs immediately for 0ms response
for (const cat in CURATED_SINGLE_SONGS) {
  recommendationsCache[cat] = {
    timestamp: Date.now(),
    items: getCuratedFallback(cat),
  };
}

// 5. Trending Music Single Songs API (100% Instant Cached Response <5ms)
app.get("/api/recommendations", (req, res) => {
  const genreKey = (req.query.genre || "all").toLowerCase();
  const userCountry = (req.query.country || "").toLowerCase();

  const isIndia = genreKey === "india" || userCountry.includes("india") || userCountry.includes("in");
  const targetCategory = (genreKey in SINGLE_SONG_QUERIES)
    ? genreKey
    : (isIndia ? "india" : "all");

  const cached = recommendationsCache[targetCategory];

  if (cached && cached.items && cached.items.length > 0) {
    // Respond INSTANTLY (<5ms)
    res.json({ recommendations: cached.items });

    // Refresh background cache asynchronously if stale (> 1 hour)
    if (Date.now() - cached.timestamp > RECS_CACHE_TTL) {
      refreshCategoryRecommendations(targetCategory);
    }
    return;
  }

  // Fallback if missing
  const fallback = getCuratedFallback(targetCategory);
  recommendationsCache[targetCategory] = { timestamp: Date.now(), items: fallback };
  res.json({ recommendations: fallback });
  refreshCategoryRecommendations(targetCategory);
});

const rooms = {};
const disconnectTimers = {};

// Helper to sanitize room payload for clients
function getSanitizedRoomState(room, clientSocketId) {
  if (!room) return null;
  const user = room.users.find((u) => u.socketId === clientSocketId);
  const isAdmin = Boolean(
    room.adminSocketId === clientSocketId || (user && user.isAdmin)
  );

  let liveCurrentTime = room.currentTime || 0;
  if (room.isPlaying && room.lastUpdated) {
    const elapsed = (Date.now() - room.lastUpdated) / 1000;
    liveCurrentTime = room.currentTime + elapsed;
    if (room.durationSec && liveCurrentTime > room.durationSec) {
      liveCurrentTime = room.durationSec;
    }
  }

  return {
    roomId: room.roomId,
    region: room.region || "Global",
    genre: room.genre || "Lofi & Chill",
    hasPasscode: Boolean(room.passcode && room.passcode.trim().length > 0),
    adminSocketId: room.adminSocketId,
    adminUsername: room.adminUsername,
    isCurrentClientAdmin: isAdmin,
    videoId: room.videoId,
    trackTitle: room.trackTitle,
    artistName: room.artistName,
    thumbnail: room.thumbnail,
    durationSec: room.durationSec,
    isPlaying: room.isPlaying,
    currentTime: liveCurrentTime,
    lastUpdated: room.lastUpdated,
    users: room.users.map((u) => {
      const isMuted = room.mutedSocketIds ? room.mutedSocketIds.has(u.socketId) : false;
      return {
        socketId: u.socketId,
        username: u.username,
        isAdmin: u.socketId === room.adminSocketId || Boolean(u.isAdmin),
        avatarColor: u.avatarColor || "#6366f1",
        isMuted: isMuted,
      };
    }),
    queue: room.queue || [],
    requests: room.requests || [],
    chatMessages: room.chatMessages || [],
  };
}

// Broadcast synchronized state individually so each client gets their correct isCurrentClientAdmin
function broadcastRoomSync(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  if (!roomSockets) return;

  for (const socketId of roomSockets) {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.emit("sync-state", getSanitizedRoomState(room, socketId));
    }
  }
}

// 1-second active room playback sync heartbeat interval
setInterval(() => {
  try {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room && room.users && room.users.length > 0 && room.isPlaying) {
        broadcastRoomSync(roomId);
      }
    }
  } catch (err) {
    console.error("Heartbeat interval error:", err?.message || err);
  }
}, 1000);

io.on("connection", (socket) => {
  // 1. Create Room
  socket.on("create-room", ({ roomId, passcode, username, avatarColor }, callback) => {
    const cleanRoomId = (roomId || "").trim().toLowerCase();
    const cleanUsername = (username || "").trim() || `DJ-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!cleanRoomId) {
      if (callback) callback({ success: false, message: "Room name cannot be empty" });
      return;
    }

    if (rooms[cleanRoomId] && rooms[cleanRoomId].users.length > 0) {
      if (callback) {
        callback({
          success: false,
          message: `Room "${cleanRoomId}" already exists. Please join it or choose another name.`,
        });
      }
      return;
    }

    // Initialize fresh room
    rooms[cleanRoomId] = {
      roomId: cleanRoomId,
      passcode: (passcode || "").trim(),
      adminSocketId: socket.id,
      adminUsername: cleanUsername,
      videoId: "jfKfPfyJRdk",
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      trackTitle: "Lofi Chill Beats",
      artistName: "Lofi Girl",
      thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60",
      durationSec: 180,
      users: [
        {
          socketId: socket.id,
          username: cleanUsername,
          isAdmin: true,
          avatarColor: avatarColor || "#8b5cf6",
        },
      ],
      mutedSocketIds: new Set(),
      queue: [],
      requests: [],
      chatMessages: [
        {
          id: `msg_${Date.now()}`,
          system: true,
          text: `🎉 ${cleanUsername} created the room! Welcome to Musync.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };

    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;
    socket.username = cleanUsername;

    if (callback) {
      callback({
        success: true,
        roomId: cleanRoomId,
        passcode: rooms[cleanRoomId].passcode,
        isAdmin: true,
      });
    }

    broadcastRoomSync(cleanRoomId);
  });

  // 2. Join Room
  socket.on("join-room", ({ roomId, passcode, username, avatarColor }, callback) => {
    const cleanRoomId = (roomId || "").trim().toLowerCase();
    const cleanUsername = (username || "").trim() || `Listener-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!cleanRoomId) {
      if (callback) callback({ success: false, message: "Room ID is required" });
      return;
    }

    let room = rooms[cleanRoomId];

    // Auto-create room if it doesn't exist yet (first user is Admin)
    if (!room) {
      room = {
        roomId: cleanRoomId,
        passcode: (passcode || "").trim(),
        adminSocketId: socket.id,
        adminUsername: cleanUsername,
        videoId: "jfKfPfyJRdk",
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
        trackTitle: "Lofi Chill Beats",
        artistName: "Lofi Girl",
        thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60",
        durationSec: 180,
        users: [],
        mutedSocketIds: new Set(),
        queue: [],
        requests: [],
        chatMessages: [
          {
            id: `msg_${Date.now()}`,
            system: true,
            text: `🎉 Room "${cleanRoomId}" started!`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      };
      rooms[cleanRoomId] = room;
    } else {
      // Validate Passcode if set
      if (room.passcode && room.passcode.length > 0) {
        const inputPass = (passcode || "").trim();
        if (inputPass !== room.passcode) {
          if (callback) {
            callback({
              success: false,
              requiresPasscode: true,
              message: "Incorrect room passcode. Please check and try again.",
            });
          }
          return;
        }
      }
    }

    if (!room.mutedSocketIds) {
      room.mutedSocketIds = new Set();
    }

    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;
    socket.username = cleanUsername;

    // Check if user is admin (first user or creator)
    const isFirstUser = room.users.length === 0;
    if (isFirstUser) {
      room.adminSocketId = socket.id;
      room.adminUsername = cleanUsername;
    }

    // Add / Update / Reconnect user in room
    let existingUserIndex = room.users.findIndex(
      (u) => u.socketId === socket.id || u.username === cleanUsername
    );

    let wasAdmin = false;
    if (existingUserIndex >= 0) {
      const existingUser = room.users[existingUserIndex];
      wasAdmin = existingUser.isAdmin || room.adminSocketId === existingUser.socketId || room.adminUsername === cleanUsername;
      
      // Cancel previous disconnect timer if reconnecting
      if (disconnectTimers[existingUser.socketId]) {
        clearTimeout(disconnectTimers[existingUser.socketId]);
        delete disconnectTimers[existingUser.socketId];
      }
    }

    const isAdmin = isFirstUser || wasAdmin || room.adminSocketId === socket.id;

    if (isAdmin) {
      room.adminSocketId = socket.id;
      room.adminUsername = cleanUsername;
    }

    const userInfo = {
      socketId: socket.id,
      username: cleanUsername,
      isAdmin: isAdmin,
      avatarColor: avatarColor || "#38bdf8",
      isDisconnected: false,
    };

    if (existingUserIndex >= 0) {
      room.users[existingUserIndex] = userInfo;
    } else {
      room.users.push(userInfo);
    }

    // Send immediate ack to joining client
    if (callback) {
      callback({
        success: true,
        roomId: cleanRoomId,
        isAdmin: userInfo.isAdmin,
      });
    }

    // Broadcast user joined chat announcement
    const joinMsg = {
      id: `msg_${Date.now()}`,
      system: true,
      text: `👋 ${cleanUsername} joined the lounge`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    room.chatMessages.push(joinMsg);
    io.to(cleanRoomId).emit("new-chat-message", joinMsg);

    // Notify other room users
    socket.to(cleanRoomId).emit("user-joined", {
      username: cleanUsername,
      socketId: socket.id,
    });

    broadcastRoomSync(cleanRoomId);
  });

  // 3. Playback State Synchronization
  socket.on("action", (data) => {
    const { roomId, type, value, trackTitle, artistName, thumbnail, durationSec } = data;
    const room = rooms[roomId];
    if (!room) return;

    // Strict Admin authorization check for playback control if more than 1 user
    if (room.users.length > 1 && socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "warning",
        message: "Only the Room Host can control playback.",
      });
      return;
    }

    if (type === "PLAY") {
      room.isPlaying = true;
      room.currentTime = value !== undefined ? value : room.currentTime;
      room.lastUpdated = Date.now();
    } else if (type === "PAUSE") {
      room.isPlaying = false;
      room.currentTime = value !== undefined ? value : room.currentTime;
      room.lastUpdated = Date.now();
    } else if (type === "SEEK") {
      room.currentTime = value;
      room.lastUpdated = Date.now();
    } else if (type === "CHANGE_TRACK") {
      room.videoId = value;
      room.currentTime = 0;
      room.isPlaying = true;
      room.trackTitle = trackTitle || "Unknown Track";
      room.artistName = artistName || "Unknown Artist";
      room.thumbnail = thumbnail || `https://img.youtube.com/vi/${value}/hqdefault.jpg`;
      room.durationSec = durationSec || 180;
      room.lastUpdated = Date.now();

      const trackMsg = {
        id: `msg_${Date.now()}_track`,
        system: true,
        text: `🎵 Now Playing: "${room.trackTitle}" - ${room.artistName}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      room.chatMessages.push(trackMsg);
      io.to(roomId).emit("new-chat-message", trackMsg);
    }

    broadcastRoomSync(roomId);
  });

  // Host playback timestamp heartbeat
  socket.on("sync-time", ({ roomId, currentTime }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id === room.adminSocketId && typeof currentTime === "number" && currentTime >= 0) {
      room.currentTime = currentTime;
      room.lastUpdated = Date.now();
    }
  });

  // 4. Request a Song to Play Next (Listener or Host)
  socket.on("request-song", ({ roomId, song, requestedBy }) => {
    const room = rooms[roomId];
    if (!room || !song) return;

    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
      durationSec: song.seconds || song.durationSec || 0,
      requestedBy: requestedBy || socket.username || "Listener",
      requestedAt: Date.now(),
    };

    room.requests.push(newRequest);

    // Notify Host
    const adminSocket = io.sockets.sockets.get(room.adminSocketId);
    if (adminSocket) {
      adminSocket.emit("notification", {
        type: "info",
        message: `🎵 New Song Request: "${song.title}" from @${newRequest.requestedBy}`,
      });
    }

    broadcastRoomSync(roomId);
  });

  // 5. Admin Accepts Song Request
  socket.on("accept-request", ({ roomId, requestId, playImmediately }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "error",
        message: "Only the Room Host can approve song requests.",
      });
      return;
    }

    const requestIndex = room.requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) return;

    const [acceptedReq] = room.requests.splice(requestIndex, 1);

    if (playImmediately) {
      room.videoId = acceptedReq.videoId;
      room.trackTitle = acceptedReq.title;
      room.artistName = acceptedReq.artist;
      room.thumbnail = acceptedReq.thumbnail;
      room.durationSec = acceptedReq.durationSec || 0;
      room.currentTime = 0;
      room.isPlaying = true;
      room.lastUpdated = Date.now();

      io.to(roomId).emit("notification", {
        type: "success",
        message: `▶ Playing requested song: "${acceptedReq.title}"`,
      });
    } else {
      room.queue.push({
        id: `queue_${Date.now()}`,
        videoId: acceptedReq.videoId,
        title: acceptedReq.title,
        artist: acceptedReq.artist,
        thumbnail: acceptedReq.thumbnail,
        duration: acceptedReq.duration,
        durationSec: acceptedReq.durationSec || 0,
        requestedBy: acceptedReq.requestedBy,
      });

      io.to(roomId).emit("notification", {
        type: "success",
        message: `Approved "${acceptedReq.title}" into Queue`,
      });
    }

    broadcastRoomSync(roomId);
  });

  // 6. Admin Rejects Song Request
  socket.on("reject-request", ({ roomId, requestId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "error",
        message: "Only the Room Host can manage song requests.",
      });
      return;
    }

    room.requests = room.requests.filter((r) => r.id !== requestId);
    broadcastRoomSync(roomId);
  });

  // 7. Add Direct to Queue
  socket.on("add-to-queue", ({ roomId, song, requestedBy }) => {
    const room = rooms[roomId];
    if (!room || !song) return;

    room.queue.push({
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
      durationSec: song.seconds || song.durationSec || 0,
      requestedBy: requestedBy || socket.username || "Host",
    });

    io.to(roomId).emit("notification", {
      type: "success",
      message: `Added "${song.title}" to Queue`,
    });

    broadcastRoomSync(roomId);
  });

  // 8. Remove from Queue
  socket.on("remove-from-queue", ({ roomId, queueItemId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "error",
        message: "Only the Room Host can remove items from queue.",
      });
      return;
    }

    room.queue = room.queue.filter((item) => item.id !== queueItemId);
    broadcastRoomSync(roomId);
  });

  // 9. Skip to Next Song in Queue (or skip track)
  socket.on("skip-track", ({ roomId, queueItemId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "warning",
        message: "Only the Room Host can skip tracks.",
      });
      return;
    }

    let nextTrack = null;

    if (queueItemId) {
      const itemIndex = room.queue.findIndex((item) => item.id === queueItemId);
      if (itemIndex >= 0) {
        [nextTrack] = room.queue.splice(itemIndex, 1);
      }
    } else if (room.queue.length > 0) {
      nextTrack = room.queue.shift();
    }

    if (nextTrack) {
      room.videoId = nextTrack.videoId;
      room.trackTitle = nextTrack.title;
      room.artistName = nextTrack.artist;
      room.thumbnail = nextTrack.thumbnail;
      room.durationSec = nextTrack.durationSec || 0;
      room.currentTime = 0;
      room.isPlaying = true;
      room.lastUpdated = Date.now();

      io.to(roomId).emit("notification", {
        type: "info",
        message: `⏭ Next track: "${nextTrack.title}"`,
      });
    } else {
      room.currentTime = 0;
      room.lastUpdated = Date.now();
    }

    broadcastRoomSync(roomId);
  });

  // 10. Reorder Queue
  socket.on("reorder-queue", ({ roomId, newQueue }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.adminSocketId) return;

    room.queue = newQueue || [];
    broadcastRoomSync(roomId);
  });

  // 11. Send Chat Message (Ultra-Fast Immediate Broadcast)
  socket.on("send-chat", ({ roomId, text, username, avatarColor }) => {
    const room = rooms[roomId];
    if (!room || !text || !text.trim()) return;

    // Check if user is muted by Host
    if (room.mutedSocketIds && room.mutedSocketIds.has(socket.id)) {
      socket.emit("notification", {
        type: "error",
        message: "🔇 You have been muted in chat by the Room Host.",
      });
      return;
    }

    const chatItem = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      username: username || socket.username || "Anonymous",
      avatarColor: avatarColor || "#6366f1",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    room.chatMessages.push(chatItem);
    if (room.chatMessages.length > 80) {
      room.chatMessages.shift();
    }

    // Direct immediate broadcast to room without waiting for heavy sync
    io.to(roomId).emit("new-chat-message", chatItem);
  });

  // 12. Floating Live Reaction
  socket.on("send-reaction", ({ roomId, emoji, username }) => {
    if (!roomId || !emoji) return;
    io.to(roomId).emit("new-reaction", {
      id: `react_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      emoji,
      username: username || socket.username || "Listener",
      x: 10 + Math.random() * 80,
    });
  });

  // 13. Host Participant Management: Kick / Remove User
  socket.on("kick-user", ({ roomId, targetSocketId, targetUsername }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "error",
        message: "Only the Room Host can remove participants.",
      });
      return;
    }

    if (targetSocketId === socket.id) {
      socket.emit("notification", {
        type: "warning",
        message: "You cannot remove yourself as Host.",
      });
      return;
    }

    const targetUser = room.users.find((u) => u.socketId === targetSocketId);
    const kickedName = targetUser ? targetUser.username : targetUsername || "User";

    // Remove user from room array
    room.users = room.users.filter((u) => u.socketId !== targetSocketId);
    if (room.mutedSocketIds) {
      room.mutedSocketIds.delete(targetSocketId);
    }

    // Notify the target user specifically and make their socket leave
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit("kicked-from-room", {
        roomId,
        reason: "You were removed from the room by the Host.",
      });
      targetSocket.leave(roomId);
      targetSocket.roomId = null;
    }

    // Add system chat message
    const sysMsg = {
      id: `msg_${Date.now()}_kick`,
      system: true,
      text: `🚫 ${kickedName} was removed from the room by Host.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    room.chatMessages.push(sysMsg);
    io.to(roomId).emit("new-chat-message", sysMsg);

    io.to(roomId).emit("notification", {
      type: "info",
      message: `Removed ${kickedName} from the room.`,
    });

    broadcastRoomSync(roomId);
  });

  // 14. Host Participant Management: Transfer Host Ownership
  socket.on("transfer-host", ({ roomId, targetSocketId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "error",
        message: "Only the Room Host can transfer room ownership.",
      });
      return;
    }

    const targetUser = room.users.find((u) => u.socketId === targetSocketId);
    if (!targetUser) return;

    // Previous admin becomes regular user
    const prevAdmin = room.users.find((u) => u.socketId === room.adminSocketId);
    if (prevAdmin) prevAdmin.isAdmin = false;

    // Target becomes new host
    targetUser.isAdmin = true;
    room.adminSocketId = targetSocketId;
    room.adminUsername = targetUser.username;

    const sysMsg = {
      id: `msg_${Date.now()}_host_transfer`,
      system: true,
      text: `👑 ${targetUser.username} is now the Room Host!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    room.chatMessages.push(sysMsg);
    io.to(roomId).emit("new-chat-message", sysMsg);

    io.to(roomId).emit("notification", {
      type: "success",
      message: `👑 ${targetUser.username} is now the Host!`,
    });

    broadcastRoomSync(roomId);
  });

  // 15. Host Participant Management: Toggle Mute in Chat
  socket.on("toggle-mute-user", ({ roomId, targetSocketId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) {
      socket.emit("notification", {
        type: "error",
        message: "Only the Room Host can mute participants.",
      });
      return;
    }

    if (!room.mutedSocketIds) {
      room.mutedSocketIds = new Set();
    }

    const targetUser = room.users.find((u) => u.socketId === targetSocketId);
    if (!targetUser) return;

    let isMutedNow = false;
    if (room.mutedSocketIds.has(targetSocketId)) {
      room.mutedSocketIds.delete(targetSocketId);
      isMutedNow = false;
    } else {
      room.mutedSocketIds.add(targetSocketId);
      isMutedNow = true;
    }

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit("notification", {
        type: isMutedNow ? "warning" : "info",
        message: isMutedNow ? "🔇 You were muted in room chat by Host." : "🔊 You were unmuted in chat.",
      });
    }

    broadcastRoomSync(roomId);
  });

      // 16. Explicit Leave Room (Bypasses Grace Period)
      socket.on("leave-room", ({ roomId }) => {
        const cleanRoomId = (roomId || socket.roomId || "").trim().toLowerCase();
        if (!cleanRoomId || !rooms[cleanRoomId]) return;

        const room = rooms[cleanRoomId];
        const userSocketId = socket.id;

        // Cancel any pending disconnect timer for this socket
        if (disconnectTimers[userSocketId]) {
          clearTimeout(disconnectTimers[userSocketId]);
          delete disconnectTimers[userSocketId];
        }

        room.users = room.users.filter((u) => u.socketId !== userSocketId);
        if (room.mutedSocketIds) {
          room.mutedSocketIds.delete(userSocketId);
        }

        socket.leave(cleanRoomId);
        socket.roomId = null;

        // If room is empty, delete room
        if (room.users.length === 0) {
          delete rooms[cleanRoomId];
          return;
        }

        // If the leaving user was admin, transfer host to next active user
        if (room.adminSocketId === userSocketId && room.users.length > 0) {
          const activeUsers = room.users.filter((u) => !u.isDisconnected);
          const newAdmin = activeUsers.length > 0 ? activeUsers[0] : room.users[0];
          newAdmin.isAdmin = true;
          room.adminSocketId = newAdmin.socketId;
          room.adminUsername = newAdmin.username;

          io.to(cleanRoomId).emit("notification", {
            type: "info",
            message: `👑 ${newAdmin.username} is now the Room Host!`,
          });
        }

        const leaveMsg = {
          id: `msg_${Date.now()}`,
          system: true,
          text: `🚪 ${socket.username || "A user"} left the room`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        room.chatMessages.push(leaveMsg);
        io.to(cleanRoomId).emit("new-chat-message", leaveMsg);

        broadcastRoomSync(cleanRoomId);
      });

      // 17. Disconnect Handling (With 25-Second Grace Period for Mobile Backgrounding)
      socket.on("disconnect", () => {
        const roomId = socket.roomId;
        const socketId = socket.id;
        if (roomId && rooms[roomId]) {
          const room = rooms[roomId];

          // Mark user as temporarily disconnected
          const userIndex = room.users.findIndex((u) => u.socketId === socketId);
          if (userIndex >= 0) {
            room.users[userIndex].isDisconnected = true;
            room.users[userIndex].disconnectedAt = Date.now();
          }

          // Start 25-second grace period timer before removing user from room
          disconnectTimers[socketId] = setTimeout(() => {
            delete disconnectTimers[socketId];

            if (!rooms[roomId]) return;

            // Remove disconnected user after grace period expires
            rooms[roomId].users = rooms[roomId].users.filter((u) => u.socketId !== socketId);
            if (rooms[roomId].mutedSocketIds) {
              rooms[roomId].mutedSocketIds.delete(socketId);
            }

            // If room is empty, delete room
            if (rooms[roomId].users.length === 0) {
              delete rooms[roomId];
              return;
            }

            // If disconnected user was admin, transfer host
            if (rooms[roomId].adminSocketId === socketId && rooms[roomId].users.length > 0) {
              const activeUsers = rooms[roomId].users.filter((u) => !u.isDisconnected);
              const newAdmin = activeUsers.length > 0 ? activeUsers[0] : rooms[roomId].users[0];
              newAdmin.isAdmin = true;
              rooms[roomId].adminSocketId = newAdmin.socketId;
              rooms[roomId].adminUsername = newAdmin.username;

              io.to(roomId).emit("notification", {
                type: "info",
                message: `👑 ${newAdmin.username} is now the Room Host!`,
              });
            }

            const sysMsg = {
              id: `msg_${Date.now()}`,
              system: true,
              text: `🚪 ${socket.username || "A user"} disconnected from room`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            rooms[roomId].chatMessages.push(sysMsg);
            io.to(roomId).emit("new-chat-message", sysMsg);

            broadcastRoomSync(roomId);
          }, 25000); // 25s background grace period
        }
      });
    });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Musync backend running on http://localhost:${PORT}`);
});