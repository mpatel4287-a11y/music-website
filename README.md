# 🎛️ MUSIC2D (Musync) — Real-Time Synchronized Music Lounge

**MUSIC2D** (formerly Musync) is a high-contrast, black-and-white retro pixel aesthetic web application designed for real-time synchronized music listening, live LRC lyrics display, and collaborative lounge rooms.

Inspired by retro 2D pixel music interfaces, MUSIC2D features a **silver metallic vinyl turntable player deck**, sub-second audio synchronization via WebSockets, and a genre-filtered YouTube recommendation engine.

---

## ✨ Key Features

- **🎛️ Metallic Vinyl Turntable Player**:
  - Realistic silver metallic turntable deck with 33⅓ RPM spinning vinyl record, tonearm assembly, screw detailing, and rotary pitch/power controls.
  - Monochrome vertical audio waveform visualizer.
  - Quick track genre tags (`Classic`), like counter badge (`+392`), and minimal playback action buttons.

- **⚡ Real-Time Synchronized Rooms**:
  - Host & Listener hierarchy powered by Socket.io.
  - Real-time seek, pause, play, and track skipping broadcasted across all room participants.
  - Room privacy protection with optional passcode access and custom room URLs.

- **🎤 Live Synced Lyrics Engine**:
  - Synchronized LRC lyric auto-scrolling engine.
  - Clickable lyric timestamps for host seeking.
  - Support for plain text and synchronized global lyrics databases.

- **📺 YouTube Music Discovery**:
  - Genre-filtered search engine providing 100% single hit tracks (2–5 minutes) while strictly filtering out multi-hour compilations and jukeboxes.
  - Supported genres: `Classic`, `90s`, `New`, `Instrumental`, `Modern playlists`, `Top Charts`, `Trending India`, and `Lo-Fi`.

- **💬 Interactive Lounge Chat & Reactions**:
  - Real-time room chat stream.
  - Instant emoji reaction bursts floating across the screen (`🔥`, `❤️`, `🎵`, `🎉`, `🚀`).
  - Host controls for muting, kicking, or transferring host privileges.

- **🔐 Account Security & Password Reset**:
  - BCrypt password hashing for user accounts.
  - Self-service password recovery flow for forgotten passwords.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 (Vite)
- **Styling**: Vanilla CSS3 with dynamic Design Tokens (`index.css`) & Google Pixel Fonts (`Silkscreen`, `Pixelify Sans`, `Press Start 2P`)
- **Icons**: Lucide React
- **WebSocket Client**: `socket.io-client`

### **Backend**
- **Runtime**: Node.js & Express.js
- **Real-Time Gateway**: Socket.io
- **YouTube API**: `yt-search`
- **Authentication & Encryption**: BCrypt.js
- **Persistence**: JSON file storage engine

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- `npm` (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone git@github.com:mpatel4287-a11y/music-webite.git
cd music-webite
```

### 2. Setup & Run the Backend Server
```bash
cd server
npm install
node server.js
```
*The backend server will run on `http://localhost:5000` (or `http://localhost:3000`).*

### 3. Setup & Run the Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
*The Vite frontend dev server will launch at `http://localhost:5173/`.*

---

## 📁 Project Structure

```
Musync/
├── client/                      # React Frontend Application
│   ├── public/                  # Static assets & favicons
│   ├── src/
│   │   ├── components/          # Modular React Components
│   │   │   ├── DashboardView.jsx# Main Lounge Explorer & Category Chips
│   │   │   ├── Header.jsx       # B&W Pixel Navigation Header & Branding
│   │   │   ├── LyricsPanel.jsx  # Live Synced LRC Lyrics View
│   │   │   ├── PlayerPanel.jsx  # Silver Metallic Vinyl Turntable Player
│   │   │   ├── QueueAndRequests.jsx # Search, Queue, Requests & Chat Sidebar
│   │   │   ├── AuthModal.jsx    # Login, Registration & Password Reset
│   │   │   └── FloatingReactions.jsx # Interactive Emoji Burst Visuals
│   │   ├── App.css              # MUSIC2D B&W Retro Pixel Design System
│   │   ├── index.css            # Root Tokens & Pixel Typography Variables
│   │   └── main.jsx             # React DOM Entry Point
│   └── vite.config.js           # Vite Configuration
├── server/                      # Node.js & Socket.io Backend
│   ├── data/                    # JSON Persistence Data Storage
│   └── server.js                # Express & Socket.io Sync Server
└── README.md                    # Project Documentation
```

---

## 📜 License

This project is licensed under the **MIT License**.
