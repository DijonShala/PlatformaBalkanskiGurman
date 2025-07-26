import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_DATA_API_KEY,
});

const terms = ['restaurant', 'food tour'];

const country_city = {
  Slovenia: ['ljubljana', 'maribor', 'celje', 'novo mesto'],
  Croatia: ['zagreb', 'split', 'rijeka'],
  'Bosnia and Herzegovina': ['sarajevo', 'mostar', 'banja luka'],
  Serbia: ['belgrade', 'novi sad', 'niš'],
  Montenegro: ['podgorica', 'kotor', 'budva'],
  Kosovo: ['pristina', 'gjakova', 'prizren', 'peja'],
  'North Macedonia': ['skopje', 'bitola', 'ohrid', 'tetovo'],
};

export async function search_by_country(country, { maxResults = 10 } = {}) {
  const cities = country_city[country] || [country.toLowerCase()];
  const publishedAfter = new Date(Date.now() - 7 * 86400 * 1000).toISOString(); // last week

  const searchQueries = terms.flatMap((term) =>
    cities.map((city) => `${term} ${city}`)
  );

  const seenVideoIds = new Set();
  const collected = [];

  for (const query of searchQueries) {
    try {
      const res = await youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults: 5,
        type: ['video'],
        publishedAfter,
        //relevanceLanguage: 'en',
        safeSearch: 'moderate',
        order: 'relevance', //'relevance'
      });

      for (const item of res.data.items || []) {
        if (seenVideoIds.has(item.id.videoId)) continue;

        seenVideoIds.add(item.id.videoId);
        collected.push({
          query,
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          publishTime: item.snippet.publishTime,
        });

        if (collected.length >= maxResults) break;
      }
    } catch (err) {
      console.error(`YouTube search error for "${query}":`, err.message);
    }

    if (collected.length >= maxResults) break;
  }
  console.log(collected);
  return collected;
}
