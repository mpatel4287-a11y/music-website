// client/src/lyricsHelper.js

// Cleans messy YouTube titles into search-friendly song titles and artists
export function parseYouTubeMetadata(rawTitle, rawArtist) {
  let title = rawTitle || "";
  let artist = rawArtist || "";

  // 1. If title is formatted as "Artist - Song Name" or "Artist: Song Name"
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    if (!artist || artist.toLowerCase().includes("topic") || artist.toLowerCase().includes("vevo")) {
      artist = parts[0].trim();
    }
    title = parts.slice(1).join(" - ").trim();
  } else if (title.includes(" : ")) {
    const parts = title.split(" : ");
    if (!artist || artist.toLowerCase().includes("topic") || artist.toLowerCase().includes("vevo")) {
      artist = parts[0].trim();
    }
    title = parts.slice(1).join(" : ").trim();
  }

  // 2. Strip bracketed junk like [Official Music Video], (Audio), (Lyrics), (From "Movie"), (Prod. by X)
  title = title
    .replace(/[\(\[][^\)\]]*(official|video|music video|audio|lyrics?|full song|hd|4k|remix|visualizer|feat\.?|ft\.?|prod\.?|cover|performance|live)[^\)\]]*[\)\]]/gi, "")
    .replace(/\|.*/g, "")
    .replace(/#[a-zA-Z0-9_]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Strip VEVO, Official, Records, or Topic from artist channel names
  artist = artist
    .replace(/\s*-\s*topic/gi, "")
    .replace(/VEVO|Official|Records|Channel/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { cleanTitle: title, cleanArtist: artist };
}

export async function fetchLyrics(rawTitle, rawArtist = "") {
  const { cleanTitle, cleanArtist } = parseYouTubeMetadata(rawTitle, rawArtist);

  try {
    // Strategy 1: Direct search using Clean Title + Artist
    let query = `${cleanTitle} ${cleanArtist}`.trim();
    let url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

    let response = await fetch(url, {
      headers: { "Lrclib-Client": "Musync-App-v2.0 (github.com/musync)" },
    });

    let results = response.ok ? await response.json() : [];

    // Strategy 2: If no results, try searching ONLY the clean title
    if (!results || results.length === 0) {
      url = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`;
      response = await fetch(url, {
        headers: { "Lrclib-Client": "Musync-App-v2.0 (github.com/musync)" },
      });
      results = response.ok ? await response.json() : [];
    }

    if (!Array.isArray(results) || results.length === 0) return null;

    // Strategy 3: Find synced lyrics match
    const syncedMatch = results.find((item) => item.syncedLyrics && item.syncedLyrics.trim().length > 0);
    if (syncedMatch) {
      return {
        ...parseLRC(syncedMatch.syncedLyrics),
        trackName: syncedMatch.trackName,
        artistName: syncedMatch.artistName,
      };
    }

    // Strategy 4: Fallback to plain text
    const plainMatch = results.find((item) => item.plainLyrics && item.plainLyrics.trim().length > 0);
    if (plainMatch) {
      return {
        type: "plain",
        text: plainMatch.plainLyrics,
        trackName: plainMatch.trackName,
        artistName: plainMatch.artistName,
      };
    }

    return null;
  } catch (error) {
    console.error("Lyrics fetch error:", error);
    return null;
  }
}

function parseLRC(lrcString) {
  const lines = lrcString.split("\n");
  const parsed = [];
  const regex = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseFloat(match[1]);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        parsed.push({
          time: minutes * 60 + seconds,
          text: text,
        });
      }
    }
  }

  return { type: "synced", lines: parsed };
}