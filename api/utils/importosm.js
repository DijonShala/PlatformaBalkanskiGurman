import { fetchPOIsFromOSM } from './osm.js';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';

dotenv.config();

const importRestaurantsFromOSM = async (city, country, userId = 1) => {
  const places = await fetchPOIsFromOSM(city, country);

  for (const place of places) {
    try {
      if (!place.lat || !place.lon) continue;

      // Skip duplicates based on name + city
      const existing = await Restaurant.findOne({
        where: { name: place.name, city: place.city },
      });
      if (existing) continue;

      const location = {
        type: 'Point',
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)],
      };

      await Restaurant.create({
        userId,
        name: place.name,
        category: place.amenity,
        foodType: place.foodType || null,
        description: place.description || null,
        address: place.address || null,
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

  console.log(`🎉 Finished importing ${places.length} places from ${city}, ${country}`);
};


const balkanCities = {
  Serbia: ['Belgrade', 'Novi Sad', 'Niš'],
  Croatia: ['Zagreb', 'Split', 'Rijeka'],
  'Bosnia and Herzegovina': ['Sarajevo', 'Banja Luka', 'Mostar'],
  Slovenia: ['Ljubljana', 'Maribor', 'Celje', 'Novo mesto'],
  Montenegro: ['Podgorica', 'Nikšić', 'Bar'],
  'North Macedonia': ['Skopje', 'Bitola', 'Ohrid'],
  Kosovo: ['Pristina', 'Peja', 'Gjakova', 'Prizren'],
};

const runImport = async () => {
  for (const [country, cities] of Object.entries(balkanCities)) {
    for (const city of cities) {
      console.log(`📍 Importing for: ${city}, ${country}`);
      await importRestaurantsFromOSM(city, country);
    }
  }

  console.log("🌍 All Balkan city imports complete.");
};

runImport();