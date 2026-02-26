/**
 * YouTube helpers — fetch latest video from a channel at build time.
 */

const YOUTUBE_MUSIC_CHANNEL_ID = 'UCgL9Lq3W-ycV_M4H3itisuA';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_MUSIC_CHANNEL_ID}`;

export interface YouTubeVideo {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
}

/**
 * Fetch the latest video from the YouTube music channel via its RSS feed.
 * Returns null if the fetch fails (e.g. rate-limited or offline).
 */
export async function fetchLatestVideo(): Promise<YouTubeVideo | null> {
  try {
    const res = await fetch(RSS_URL);
    if (!res.ok) {
      console.warn(`[youtube] RSS fetch failed: ${res.status}`);
      return null;
    }

    const xml = await res.text();

    // Extract first <entry> block
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) return null;

    const entry = entryMatch[1];

    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? '';
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '';
    const thumbnail =
      entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    if (!videoId) return null;

    return { id: videoId, title, published, thumbnail };
  } catch (err) {
    console.warn('[youtube] Failed to fetch latest video:', err);
    return null;
  }
}
