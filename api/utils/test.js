import dotenv from 'dotenv';
import { analyzeVideo } from './review-videos.js';
import axios from 'axios';
import Restaurant from '../models/Restaurant.js';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_DATA_API_KEY;

function isValidCoordinate(val) {
  return typeof val === 'number' && !isNaN(val);
}

async function getVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const response = await axios.get(url);

  if (!response.data.items.length) {
    throw new Error('Video not found');
  }

  const { title, description } = response.data.items[0].snippet;
  return { title, description };
}

async function test(videoId) {
  try {
    console.log(`Fetching details for video ID: ${videoId}`);
    const { title, description } = await getVideoDetails(videoId);

    console.log(`Video Title: ${title}`);
    console.log(`Video Description: ${description}`);

    const restaurants = await analyzeVideo({ title, description });

    console.log('Raw extraction result:', restaurants);

    if (!restaurants) {
      console.log('❌ No valid restaurant info extracted.');
      return;
    }

    const parsed = Array.isArray(restaurants) ? restaurants : [restaurants];

    for (const place of parsed) {
      try {
        if (!place.name || !place.address || !place.city || !place.country) {
          console.log('⚠️ Skipping incomplete entry:', place);
          continue;
        }

        const existing = await Restaurant.findOne({
          where: { name: place.name, city: place.city },
        });
        if (existing) {
          console.log(`ℹ️ Already exists: ${place.name} (${place.city})`);
          continue;
        }

        const longitude = parseFloat(place.longitude);
        const latitude = parseFloat(place.latitude);

        const location =
          isValidCoordinate(longitude) && isValidCoordinate(latitude)
            ? {
                type: 'Point',
                coordinates: [longitude, latitude],
              }
            : null;

        await Restaurant.create({
          userId: 1,
          name: place.name,
          category: place.category,
          foodType: Array.isArray(place.foodType)
            ? place.foodType
            : place.foodType
            ? [place.foodType]
            : [],
          description: place.description || null,
          address: place.address,
          postalCode: place.postalCode || null,
          city: place.city,
          country: place.country,
          location,
          photos: [],
        });

        console.log(`✅ Added: ${place.name} (${place.city})`);
      } catch (err) {
        console.error(`❌ Failed to insert ${place.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Call test wrapped in async IIFE (if your environment supports it)
(async () => {
  const VIDEO_ID = 'LxXFcmmCxzw'; // replace with your test video ID
  await test(VIDEO_ID);
})();
