import { search_by_country } from './ytsearch.js';
import { analyzeVideo } from './openai_analyse.js';
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
  const day = new Date().getDate();
  const index = day % COUNTRIES.length;
  return COUNTRIES[index];
}

function isValidCoordinate(value) {
  return typeof value === 'number' && !isNaN(value);
}

export async function run(country = getTodayCountry()) {
  console.log(`Country: ${country}`);
  const videos = await search_by_country(country, { maxResults: 10 });

  for (const video of videos) {
    const restaurants = await analyzeVideo({
      title: video.title,
      description: video.description,
    });

    if (!restaurants || !Array.isArray(restaurants)) {
      console.log('NOO valid restaurant info');
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
        //IF there is  no name, addr skip dont save
        if (!name || !category || !address || !city || !country) {
          continue;
        }

        const existing = await Restaurant.findOne({
          where: { name, city },
        });

        if (existing) {
          console.log(`Already exists: ${name} (${city})`);
          continue;
        }

        const hasValidCoords =
          isValidCoordinate(latitude) && isValidCoordinate(longitude);
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

        console.log(`__ADD__: ${name} (${city})`);
      } catch (err) {
        console.error(`___FAILL___`, err.message);
      }
    }
  }
}
