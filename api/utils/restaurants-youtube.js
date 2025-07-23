// extract-restaurants.js
import { searchVideosByCountry } from './ytdata.js';
import { analyzeVideo } from './review-videos.js';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';

dotenv.config();

const COUNTRIES = [
  'Slovenia',
  'Croatia',
  'Bosnia and Herzegovina',
  'Serbia',
  'Montenegro',
  'Kosovo',
  'North Macedonia',
];

export function getTodayCountry() {
  const day = new Date().getDate(); // 1–31
  const index = day % COUNTRIES.length;
  return COUNTRIES[index];
}

function isValidCoordinate(value) {
  return typeof value === 'number' && !isNaN(value);
}

async function run(country = getTodayCountry()) {
  console.log(`📍 Processing country: ${country}`);
  const videos = await searchVideosByCountry(country, { maxResults: 10 });

  for (const video of videos) {
    console.log(`\n🔎 Analyzing: ${video.title}`);
    const restaurants = await analyzeVideo({
      title: video.title,
      description: video.description,
    });

    if (!restaurants || !Array.isArray(restaurants)) {
      console.log('❌ No valid restaurant info extracted.');
      continue;
    }

    for (const place of restaurants) {
      try {
        const {
          name,
          category,
          address,
          city,
          country,
          postalCode,
          foodType,
          description,
          latitude,
          longitude,
        } = place;

        if (!name || !category || !address || !city || !country) {
          console.log(`⚠️ Skipping incomplete entry:`, place);
          continue;
        }

        const existing = await Restaurant.findOne({
          where: { name, city },
        });

        if (existing) {
          console.log(`ℹ️ Already exists: ${name} (${city})`);
          continue;
        }

        const hasValidCoords = isValidCoordinate(latitude) && isValidCoordinate(longitude);
        const location = hasValidCoords
          ? { type: 'Point', coordinates: [longitude, latitude] }
          : null;

        await Restaurant.create({
          userId: 1,
          name,
          category,
          foodType: Array.isArray(foodType) ? foodType : [],
          description: description || null,
          address,
          postalCode: postalCode || null,
          city,
          country,
          location,
          photos: [],
        });

        console.log(`✅ Added: ${name} (${city})`);
      } catch (err) {
        console.error(`❌ Failed to insert restaurant:`, err.message);
      }
    }
  }

  console.log(`🎉 Finished processing YouTube data for ${country}`);
}

run().catch((err) => {
  console.error('💥 Error in run():', err);
});
