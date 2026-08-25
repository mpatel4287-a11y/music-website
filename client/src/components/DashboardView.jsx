import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Radio,
  Users,
  Play,
  Lock,
  LockOpen,
  PlusCircle,
  Sparkles,
  Search,
  Flame,
  ArrowRight,
  Headphones,
  MapPin,
  Navigation,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const GENRE_TABS = [
  { id: "classic", label: "Classic", solid: true },
  { id: "90s", label: "90s" },
  { id: "new", label: "New" },
  { id: "instrumental", label: "Instrumental" },
  { id: "modern", label: "Modern playlists" },
  { id: "all", label: "Top Charts" },
  { id: "india", label: "Trending India" },
  { id: "lofi", label: "Lo-Fi" },
];

const CLIENT_FALLBACK_RECOMMENDATIONS = {
  all: [
    { videoId: "vA83L5XN694", title: "Tauba Tauba", artist: "Karan Aujla", duration: "3:25", seconds: 205, thumbnail: "https://img.youtube.com/vi/vA83L5XN694/hqdefault.jpg" },
    { videoId: "eVli-tstM5E", title: "Espresso", artist: "Sabrina Carpenter", duration: "2:55", seconds: 175, thumbnail: "https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg" },
    { videoId: "V9PVRfjEBTI", title: "BIRDS OF A FEATHER", artist: "Billie Eilish", duration: "3:17", seconds: 197, thumbnail: "https://img.youtube.com/vi/V9PVRfjEBTI/hqdefault.jpg" },
    { videoId: "c183-W1s4h0", title: "Not Like Us", artist: "Kendrick Lamar", duration: "4:34", seconds: 274, thumbnail: "https://img.youtube.com/vi/c183-W1s4h0/hqdefault.jpg" },
    { videoId: "g6_tK0x_XwQ", title: "Husn", artist: "Anuv Jain", duration: "3:38", seconds: 218, thumbnail: "https://img.youtube.com/vi/g6_tK0x_XwQ/hqdefault.jpg" },
    { videoId: "yJg-Y5byMMw", title: "Big Dawgs", artist: "Hanumankind", duration: "3:53", seconds: 233, thumbnail: "https://img.youtube.com/vi/yJg-Y5byMMw/hqdefault.jpg" },
    { videoId: "BddP6PYo2gs", title: "Kesariya", artist: "Arijit Singh", duration: "4:28", seconds: 268, thumbnail: "https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg" },
    { videoId: "vK4s7p6vF7c", title: "Softly", artist: "Karan Aujla", duration: "2:35", seconds: 155, thumbnail: "https://img.youtube.com/vi/vK4s7p6vF7c/hqdefault.jpg" },
  ],
  india: [
    { videoId: "vA83L5XN694", title: "Tauba Tauba", artist: "Karan Aujla", duration: "3:25", seconds: 205, thumbnail: "https://img.youtube.com/vi/vA83L5XN694/hqdefault.jpg" },
    { videoId: "yJg-Y5byMMw", title: "Big Dawgs", artist: "Hanumankind", duration: "3:53", seconds: 233, thumbnail: "https://img.youtube.com/vi/yJg-Y5byMMw/hqdefault.jpg" },
    { videoId: "g6_tK0x_XwQ", title: "Husn", artist: "Anuv Jain", duration: "3:38", seconds: 218, thumbnail: "https://img.youtube.com/vi/g6_tK0x_XwQ/hqdefault.jpg" },
    { videoId: "vK4s7p6vF7c", title: "Softly", artist: "Karan Aujla", duration: "2:35", seconds: 155, thumbnail: "https://img.youtube.com/vi/vK4s7p6vF7c/hqdefault.jpg" },
    { videoId: "BddP6PYo2gs", title: "Kesariya", artist: "Arijit Singh", duration: "4:28", seconds: 268, thumbnail: "https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg" },
    { videoId: "D4hR_jZ1W_M", title: "Heeriye", artist: "Jasleen Royal & Arijit Singh", duration: "3:14", seconds: 194, thumbnail: "https://img.youtube.com/vi/D4hR_jZ1W_M/hqdefault.jpg" },
  ],
  new: [
    { videoId: "eVli-tstM5E", title: "Espresso", artist: "Sabrina Carpenter", duration: "2:55", seconds: 175, thumbnail: "https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg" },
    { videoId: "V9PVRfjEBTI", title: "BIRDS OF A FEATHER", artist: "Billie Eilish", duration: "3:17", seconds: 197, thumbnail: "https://img.youtube.com/vi/V9PVRfjEBTI/hqdefault.jpg" },
    { videoId: "vA83L5XN694", title: "Tauba Tauba", artist: "Karan Aujla", duration: "3:25", seconds: 205, thumbnail: "https://img.youtube.com/vi/vA83L5XN694/hqdefault.jpg" },
    { videoId: "c183-W1s4h0", title: "Not Like Us", artist: "Kendrick Lamar", duration: "4:34", seconds: 274, thumbnail: "https://img.youtube.com/vi/c183-W1s4h0/hqdefault.jpg" },
  ],
  modern: [
    { videoId: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", seconds: 200, thumbnail: "https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg" },
    { videoId: "TUVcZfQe-Kw", title: "Levitating", artist: "Dua Lipa", duration: "3:23", seconds: 203, thumbnail: "https://img.youtube.com/vi/TUVcZfQe-Kw/hqdefault.jpg" },
    { videoId: "H5v3kku4y6Q", title: "As It Was", artist: "Harry Styles", duration: "2:47", seconds: 167, thumbnail: "https://img.youtube.com/vi/H5v3kku4y6Q/hqdefault.jpg" },
    { videoId: "ic8j13gRBSQ", title: "Cruel Summer", artist: "Taylor Swift", duration: "2:58", seconds: 178, thumbnail: "https://img.youtube.com/vi/ic8j13gRBSQ/hqdefault.jpg" },
  ],
  lofi: [
    { videoId: "jJPMnTXl63E", title: "death bed (coffee for your head)", artist: "Powfu", duration: "2:53", seconds: 173, thumbnail: "https://img.youtube.com/vi/jJPMnTXl63E/hqdefault.jpg" },
    { videoId: "9g267f8M2x0", title: "Get You The Moon", artist: "Kina ft. Snow", duration: "2:59", seconds: 179, thumbnail: "https://img.youtube.com/vi/9g267f8M2x0/hqdefault.jpg" },
    { videoId: "3N3hHjB8Z9w", title: "Can We Kiss Forever?", artist: "Kina", duration: "3:07", seconds: 187, thumbnail: "https://img.youtube.com/vi/3N3hHjB8Z9w/hqdefault.jpg" },
  ],
  classic: [
    { videoId: "h_D3VFfhvs4", title: "Lag Ja Gale Se Phir", artist: "Lata Mangeshkar", duration: "4:15", seconds: 255, thumbnail: "https://img.youtube.com/vi/h_D3VFfhvs4/hqdefault.jpg" },
    { videoId: "h53iJ8W68_4", title: "Pal Pal Dil Ke Pas", artist: "Kishore Kumar", duration: "5:25", seconds: 325, thumbnail: "https://img.youtube.com/vi/h53iJ8W68_4/hqdefault.jpg" },
    { videoId: "1w7OgIMMRc4", title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55", seconds: 355, thumbnail: "https://img.youtube.com/vi/1w7OgIMMRc4/hqdefault.jpg" },
  ],
  "90s": [
    { videoId: "c2ZAC6v_4", title: "Tujhe Dekha To", artist: "Kumar Sanu", duration: "5:02", seconds: 302, thumbnail: "https://img.youtube.com/vi/c2ZAC6v_4/hqdefault.jpg" },
    { videoId: "gJliFHAbr6c", title: "Pehla Nasha", artist: "Udit Narayan", duration: "4:48", seconds: 288, thumbnail: "https://img.youtube.com/vi/gJliFHAbr6c/hqdefault.jpg" },
    { videoId: "hZvFGEE2HaU", title: "Smells Like Teen Spirit", artist: "Nirvana", duration: "4:38", seconds: 278, thumbnail: "https://img.youtube.com/vi/hZvFGEE2HaU/hqdefault.jpg" },
  ],
  instrumental: [
    { videoId: "7maJOI3QMu0", title: "River Flows in You", artist: "Yiruma", duration: "3:08", seconds: 188, thumbnail: "https://img.youtube.com/vi/7maJOI3QMu0/hqdefault.jpg" },
    { videoId: "kcihcYEOeic", title: "Nuvole Bianche", artist: "Ludovico Einaudi", duration: "5:58", seconds: 358, thumbnail: "https://img.youtube.com/vi/kcihcYEOeic/hqdefault.jpg" },
  ],
};


const getEffectiveBackendUrl = (url) => {
  if (url && typeof url === "string" && url.startsWith("http")) {
    return url.replace(/\/$/, "");
  }
  return "https://music-website-production.up.railway.app";
};

export default function DashboardView({
  username,
  avatarColor,
  onCreateRoom,
  onJoinRoom,
  onHostSongDirect,
  onReturnToLounge,
  inRoom,
  currentRoomId,
  backendUrl,
}) {
  const effectiveBackend = getEffectiveBackendUrl(backendUrl);
  const [selectedGenreTab, setSelectedGenreTab] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all"); // 'all' | 'free' | 'protected'

  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const [roomsList, setRoomsList] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Location State
  const [locationPermission, setLocationPermission] = useState("prompt"); // 'prompt' | 'granted' | 'denied' | 'locating'
  const [userLocation, setUserLocation] = useState(null);

  // Auto request location if previously cached in localStorage
  useEffect(() => {
    const cachedLoc = localStorage.getItem("musync_location");
    if (cachedLoc) {
      try {
        const parsed = JSON.parse(cachedLoc);
        setUserLocation(parsed);
        setLocationPermission("granted");
      } catch (e) {}
    }
  }, []);

  const fetchIPLocationFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const locationData = {
        city: data.city || "Bengaluru",
        country: data.country_name || "India",
      };
      setUserLocation(locationData);
      setLocationPermission("granted");
      localStorage.setItem("musync_location", JSON.stringify(locationData));
    } catch (e) {
      const defaultLoc = { city: "Bengaluru", country: "India" };
      setUserLocation(defaultLoc);
      setLocationPermission("granted");
      localStorage.setItem("musync_location", JSON.stringify(defaultLoc));
    }
  };

  const handleRequestLocation = () => {
    setLocationPermission("locating");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const data = await res.json();
            const city =
              data.city || data.locality || data.principalSubdivision || "Bengaluru";
            const country = data.countryName || "India";

            const locationData = { city, country, lat, lng };
            setUserLocation(locationData);
            setLocationPermission("granted");
            localStorage.setItem("musync_location", JSON.stringify(locationData));
          } catch (err) {
            fetchIPLocationFallback();
          }
        },
        (error) => {
          fetchIPLocationFallback();
        },
        { timeout: 4000, maximumAge: 60000, enableHighAccuracy: false }
      );
    } else {
      fetchIPLocationFallback();
    }
  };

  const recsCacheRef = useRef({});

  // Fetch Recommendations based on selected genre and country location
  useEffect(() => {
    let isMounted = true;

    const fallbackList = CLIENT_FALLBACK_RECOMMENDATIONS[selectedGenreTab] || CLIENT_FALLBACK_RECOMMENDATIONS.all;
    if (recsCacheRef.current[selectedGenreTab]) {
      setRecommendations(recsCacheRef.current[selectedGenreTab]);
      setIsLoadingRecs(false);
    } else {
      setRecommendations(fallbackList);
      setIsLoadingRecs(false);
    }

    const countryParam = userLocation?.country || "India";
    const apiUrl = `${effectiveBackend}/api/recommendations?genre=${encodeURIComponent(
      selectedGenreTab
    )}&country=${encodeURIComponent(countryParam)}`;

    fetch(apiUrl)
      .then((res) => (res.ok ? res.json() : { recommendations: [] }))
      .then((data) => {
        if (isMounted && data.recommendations && data.recommendations.length > 0) {
          recsCacheRef.current[selectedGenreTab] = data.recommendations;
          setRecommendations(data.recommendations);
        }
      })
      .catch(() => {
        // Retain fallback list on network error
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecs(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedGenreTab, userLocation, effectiveBackend]);

  // Fetch Active Public/Protected Rooms
  const fetchActiveRooms = () => {
    setIsLoadingRooms(true);
    fetch(`${effectiveBackend}/api/rooms`)
      .then((res) => (res.ok ? res.json() : { rooms: [] }))
      .then((data) => {
        setRoomsList(data.rooms || []);
        setIsLoadingRooms(false);
      })
      .catch(() => setIsLoadingRooms(false));
  };

  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 8000);
    return () => clearInterval(interval);
  }, [effectiveBackend]);

  const [songSearchResults, setSongSearchResults] = useState([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);

  // Live YouTube song search on Dashboard search input change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSongSearchResults([]);
      setIsSearchingSongs(false);
      return;
    }

    setIsSearchingSongs(true);
    const timer = setTimeout(() => {
      fetch(`${effectiveBackend}/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => {
          setSongSearchResults(data.results || []);
        })
        .catch((err) => {
          console.warn("Dashboard song search error:", err);
          setSongSearchResults([]);
        })
        .finally(() => {
          setIsSearchingSongs(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, effectiveBackend]);

  // Filter Active Rooms based on Access & Search Query
  const filteredRooms = roomsList.filter((room) => {
    // Access Filter
    if (accessFilter === "free" && room.hasPasscode) return false;
    if (accessFilter === "protected" && !room.hasPasscode) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = room.roomId.toLowerCase().includes(q);
      const matchTrack = room.trackTitle?.toLowerCase().includes(q);
      const matchHost = room.adminUsername?.toLowerCase().includes(q);
      const matchLoc = room.location?.toLowerCase().includes(q);
      return matchId || matchTrack || matchHost || matchLoc;
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      {/* 1. User Welcome Hero */}
      <section className="dashboard-hero-card">
        <div className="hero-ambient-glow"></div>
        <div className="hero-content-group">
          <div className="hero-user-badge">
            <div
              className="hero-avatar-ring"
              style={{ borderColor: avatarColor || "#8b5cf6" }}
            >
              <div
                className="hero-avatar"
                style={{ backgroundColor: avatarColor || "#8b5cf6" }}
              >
                {username ? username.charAt(0).toUpperCase() : "🎧"}
              </div>
            </div>
            <div className="hero-text-block">
              <div className="hero-tag-badge">
                <Sparkles size={13} className="text-accent" />
                <span>REAL-TIME SYNCHRONIZED AUDIO PLATFORM</span>
              </div>
              <h1 className="hero-greeting">
                {username ? `Welcome back, ${username}!` : "Welcome to Musync Lounge!"}
              </h1>
              <p className="hero-subtext">
                {userLocation
                  ? `📍 Connected in ${userLocation.city}${userLocation.country ? `, ${userLocation.country}` : ""} • Live trending single tracks & nearby rooms`
                  : "Listen to real-time synchronized music rooms or host your own live audio session."}
              </p>
            </div>
          </div>

          <div className="hero-action-buttons">
            {inRoom && currentRoomId && (
              <button
                type="button"
                className="btn-accent-glow"
                onClick={() => {
                  if (onReturnToLounge) onReturnToLounge();
                }}
              >
                <Radio size={16} />
                <span>Return to Active Room ({currentRoomId})</span>
              </button>
            )}

            <button
              type="button"
              className="btn-primary-glow"
              onClick={() => onCreateRoom()}
            >
              <PlusCircle size={16} />
              <span>Create New Room</span>
            </button>
          </div>
        </div>
      </section>

      {/* Global Song & Room Search Bar */}
      <div className="global-dashboard-search-wrapper" style={{ margin: "16px 0 24px" }}>
        <div className="room-search-bar" style={{ maxWidth: "700px", margin: "0 auto", padding: "10px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Search size={18} className="search-icon" style={{ color: "var(--text-accent, #8b5cf6)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search any song, artist, or live room (e.g. Coldplay, Arijit, Die With A Smile)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="room-search-input"
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.95rem" }}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Live Song Search Results Section */}
      {searchQuery.trim() && (
        <section className="dashboard-section" style={{ marginBottom: "32px" }}>
          <div className="section-header">
            <div className="section-title-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Search size={20} className="text-accent" />
              <h2>Live YouTube Songs for "{searchQuery}"</h2>
            </div>
          </div>

          {isSearchingSongs ? (
            <div className="dashboard-loading-placeholder">
              <RefreshCw size={24} className="spin-slow text-accent" />
              <span>Searching live YouTube music for "{searchQuery}"...</span>
            </div>
          ) : songSearchResults.length > 0 ? (
            <div className="recommendations-grid">
              {songSearchResults.map((song) => (
                <div key={song.videoId} className="song-recommendation-card">
                  <div className="card-artwork-wrapper">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="card-artwork-img"
                    />
                    <div className="card-play-overlay">
                      <button
                        type="button"
                        className="card-quick-play-btn"
                        onClick={() => onHostSongDirect(song)}
                        title="Host new room with this song"
                      >
                        <Play size={18} fill="#fff" />
                      </button>
                    </div>
                    <span className="duration-pill">{song.duration}</span>
                  </div>

                  <div className="song-card-info">
                    <h4 className="song-card-title" title={song.title}>
                      {song.title}
                    </h4>
                    <p className="song-card-artist">{song.artist}</p>
                  </div>

                  <button
                    type="button"
                    className="btn-mini-host-song"
                    onClick={() => onHostSongDirect(song)}
                  >
                    <Headphones size={13} />
                    <span>Host Room</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-rooms-box">
              <p>No songs found for "{searchQuery}". Try another song or artist name!</p>
            </div>
          )}
        </section>
      )}

      {/* 2. Music Categories & Tracks Shelf */}
      <section className="dashboard-section">
        <div className="section-header pixel-section-header">
          <div className="section-title-group">
            <h2 className="pixel-heading-main">Music Categories</h2>
            <button type="button" className="view-all-link pixel-font">View all</button>
          </div>

          {/* Black & White Pill Tabs matching mockup */}
          <div className="genre-pill-tabs pixel-pills-row">
            {GENRE_TABS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`genre-tab-chip pixel-chip ${selectedGenreTab === g.id ? "active" : ""}`}
                onClick={() => setSelectedGenreTab(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>


        {/* Recommendation Song Cards Grid */}
        {isLoadingRecs ? (
          <div className="dashboard-loading-placeholder">
            <TrendingUp size={24} className="spin-slow text-accent" />
            <span>Fetching top trending single songs for your location...</span>
          </div>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((song) => (
              <div key={song.videoId} className="song-recommendation-card">
                <div className="card-artwork-wrapper">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="card-artwork-img"
                  />
                  <div className="card-play-overlay">
                    <button
                      type="button"
                      className="card-quick-play-btn"
                      onClick={() => onHostSongDirect(song)}
                      title="Host new room with this song"
                    >
                      <Play size={18} fill="#fff" />
                    </button>
                  </div>
                  <span className="trending-tag-pill">🔥 Single Track</span>
                  <span className="duration-pill">{song.duration}</span>
                </div>

                <div className="song-card-info">
                  <h4 className="song-card-title" title={song.title}>
                    {song.title}
                  </h4>
                  <p className="song-card-artist">{song.artist}</p>
                </div>

                <button
                  type="button"
                  className="btn-mini-host-song"
                  onClick={() => onHostSongDirect(song)}
                >
                  <Headphones size={13} />
                  <span>Host Room</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Location-Based Lounges & Free Rooms Explorer */}
      <section className="dashboard-section">
        <div className="section-header">
          <div className="section-title-group">
            <MapPin size={22} className="text-accent" />
            <h2>Nearby Lounges & Free Rooms</h2>
          </div>

          <div className="filter-controls-row">
            {/* Access Filter (Free vs Protected) */}
            <div className="access-filter-tabs">
              <button
                type="button"
                className={`access-btn ${accessFilter === "all" ? "active" : ""}`}
                onClick={() => setAccessFilter("all")}
              >
                All Lounges
              </button>
              <button
                type="button"
                className={`access-btn ${accessFilter === "free" ? "active" : ""}`}
                onClick={() => setAccessFilter("free")}
              >
                <LockOpen size={12} className="text-success" />
                <span>Free Rooms</span>
              </button>
              <button
                type="button"
                className={`access-btn ${accessFilter === "protected" ? "active" : ""}`}
                onClick={() => setAccessFilter("protected")}
              >
                <Lock size={12} className="text-warning" />
                <span>Protected</span>
              </button>
            </div>
          </div>
        </div>

        {/* Location Permission Prompt / Status Banner */}
        <div className="location-permission-card">
          {locationPermission === "granted" && userLocation ? (
            <div className="location-status-bar">
              <div className="location-active-badge">
                <MapPin size={16} className="location-pin-icon" />
                <span>
                  Location Active: <strong>{userLocation.city}</strong>
                  {userLocation.country ? `, ${userLocation.country}` : ""}
                </span>
              </div>
              <button
                type="button"
                className="btn-refresh-location"
                onClick={handleRequestLocation}
                title="Update Location"
              >
                <RefreshCw size={14} />
                <span>Update</span>
              </button>
            </div>
          ) : (
            <div className="location-prompt-bar">
              <div className="location-prompt-text">
                <Navigation size={20} className="text-accent spin-subtle" />
                <div>
                  <h4>Discover Live Audio Lounges Near You</h4>
                  <p>Grant location permission to find rooms hosted in your city or country.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-enable-location"
                onClick={handleRequestLocation}
                disabled={locationPermission === "locating"}
              >
                <MapPin size={15} />
                <span>
                  {locationPermission === "locating"
                    ? "Detecting Location..."
                    : "Enable Location Access"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Search input for rooms */}
        <div className="room-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search active rooms by Room ID, Track Title, Host or Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="room-search-input"
          />
        </div>

        {/* Active Rooms Grid */}
        {isLoadingRooms && roomsList.length === 0 ? (
          <div className="dashboard-loading-placeholder">
            <Radio size={24} className="spin-slow text-accent" />
            <span>Scanning active lounges...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-rooms-box">
            <Compass size={32} className="text-muted" />
            <h3>No Active Rooms Found</h3>
            <p>No active music rooms match your current filters. Be the first to start a room!</p>
            <button
              type="button"
              className="btn-primary-glow"
              onClick={() => onCreateRoom()}
            >
              <PlusCircle size={16} />
              <span>Start New Public Room</span>
            </button>
          </div>
        ) : (
          <div className="active-rooms-grid">
            {filteredRooms.map((room) => (
              <div key={room.roomId} className="room-explorer-card">
                <div className="room-card-header">
                  <div className="room-title-info">
                    <span className="live-pulse-dot"></span>
                    <h3 className="room-card-id">{room.roomId}</h3>
                  </div>

                  <div className="room-badge-group">
                    <span className="location-pill-tag">
                      <MapPin size={11} /> {room.location || "Global"}
                    </span>
                    {room.hasPasscode ? (
                      <span className="access-tag protected">
                        <Lock size={11} /> Passcode
                      </span>
                    ) : (
                      <span className="access-tag free">
                        <LockOpen size={11} /> Free
                      </span>
                    )}
                  </div>
                </div>

                <div className="room-track-preview">
                  <img
                    src={
                      room.thumbnail ||
                      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=60"
                    }
                    alt={room.trackTitle}
                    className="room-track-thumb"
                  />
                  <div className="room-track-details">
                    <h4 className="room-song-title">{room.trackTitle || "Lofi Beats"}</h4>
                    <p className="room-artist-name">{room.artistName || "Musync Lounge"}</p>
                    <span className="host-by-line">Host: @{room.adminUsername}</span>
                  </div>
                </div>

                <div className="room-card-footer">
                  <div className="listeners-badge">
                    <Users size={14} />
                    <span>{room.listenersCount} Listeners</span>
                  </div>

                  <button
                    type="button"
                    className="btn-join-room"
                    onClick={() => onJoinRoom(room.roomId, room.hasPasscode)}
                  >
                    <span>Join Room</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
