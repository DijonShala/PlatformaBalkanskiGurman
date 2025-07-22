// youtube.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_DATA_API_KEY,
});

export async function findYouTubeReview(name, city) {
  const q = `${name} ${city} restaurant review`;

  try {
    const res = await youtube.search.list({
      part: ['snippet'],
      q,
      maxResults: 1,
      type: ['video'],
      order: 'relevance',
      relevanceLanguage: 'en',
      safeSearch: 'moderate',
    });

    const item = res.data.items?.[0];
    if (item) {
      return {
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    }
  } catch (err) {
    console.error(`YouTube error for ${q}:`, err.message);
  }

  return null;
}
