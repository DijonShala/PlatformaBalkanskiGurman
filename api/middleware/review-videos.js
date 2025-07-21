// review-videos.js
import { searchVideos } from './ytdata.js';

async function review() {
  const videos = await searchVideos({ maxResults: 5, daysAgo: 5 });

  console.log(`Found ${videos.length} videos:\n`);
  for (const v of videos) {
    console.log(`📹 ${v.title}`);
    console.log(`   https://www.youtube.com/watch?v=${v.videoId}`);
    console.log(`   Channel: ${v.channelTitle}`);
    console.log(`   Published: ${v.publishTime}`);
    console.log(`   Region: ${v.region}`);
    console.log(`   Desc: ${v.description?.slice(0, 150)}...\n`);
  }
}

review();
