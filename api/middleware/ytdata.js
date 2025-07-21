// ytdata.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_DATA_API_KEY,
});

// High-quality core terms
const SEARCH_TERMS = [
  'restaurant review',
  'best restaurants',
  'street food',
  'local food spots',
  'hidden gem restaurants',
  'where to eat',
  'top restaurants',
  'must try restaurants',
];

// Targeted Balkan locations
const LOCATION_KEYWORDS = [
  'sarajevo', 'belgrade', 'ljubljana', 'zagreb',
  'skopje', 'podgorica', 'pristina',
  'bosnia', 'serbia', 'croatia', 'slovenia',
  'montenegro', 'macedonia', 'kosovo'
];

// Utility: sample `n` random elements
function getRandomSubarray(arr, n) {
  return arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, n)
    .map(({ value }) => value);
}

export async function searchVideos({ maxResults = 5, queryCount = 5 } = {}) {
  const publishedAfter = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const queries = getRandomSubarray(
    SEARCH_TERMS.flatMap((term) =>
      getRandomSubarray(LOCATION_KEYWORDS, 1).map((loc) => `${term} ${loc}`)
    ),
    queryCount
  );

  const results = [];

  for (const q of queries) {
    try {
      const res = await youtube.search.list({
        part: ['snippet'],
        q,
        type: ['video'],
        maxResults,
        order: 'relevance',
        publishedAfter,
        relevanceLanguage: 'en', // you can rotate or change this
      });

      for (const item of res.data.items || []) {
        results.push({
          query: q,
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          publishTime: item.snippet.publishTime,
        });
      }
    } catch (err) {
      console.error(`Error on query "${q}":`, err.message);
    }
  }

  return results;
}
