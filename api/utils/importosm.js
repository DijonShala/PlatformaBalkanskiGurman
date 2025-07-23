import { fetchPOIsFromOSM } from './osm.js';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20_000,
});

const FOOD_TYPES = [
  "Slovenian", "Croatian", "Bosnian", "Serbian", "Montenegrin", "Macedonian", "Kosovar",
  "Balkan", "Yugoslav Fusion", "Bakery", "Barbecue", "Pizza", "Seafood", "Grill", "Mediterranean",
  "Middle Eastern", "Greek", "Turkish", "Italian", "Fusion", "Vegan", "Vegetarian", "Asian", "American",
  "French", "Chinese", "Indian", "Mexican"
];

async function fetchDetailsFromOpenAI(name, city, country) {
  // Compose prompt to get foodType and description from OpenAI
  const prompt = `
Given the restaurant name "${name}" located in ${city}, ${country}, provide a short description of the restaurant and the main food type(s) it serves. 
Only respond with a JSON object like this:

{
  "description": "string",
  "foodType": ["list", "of", "valid", "food types"]
}

Only include foodType values from this allowed list:

${FOOD_TYPES.join(", ")}

If uncertain about food types, leave the list empty.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that only replies with JSON." },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(text);
    // Filter foodType array by allowed types only
    const filteredFoodTypes = (parsed.foodType || []).filter(ft => FOOD_TYPES.includes(ft));
    return {
      description: parsed.description || null,
      foodType: filteredFoodTypes.length > 0 ? filteredFoodTypes : null,
    };
  } catch (err) {
    console.error(`OpenAI enrich error for "${name}":`, err.message);
    return { description: null, foodType: null };
  }
}

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

      let { foodType, description } = place;

      // Enrich missing foodType or description via OpenAI
      if (!foodType || !description) {
        const enrichment = await fetchDetailsFromOpenAI(place.name, city, country);
        foodType = foodType || enrichment.foodType;
        description = description || enrichment.description;
      }

      // Ensure foodType is either null or array of valid types
      if (foodType && !Array.isArray(foodType)) {
        foodType = FOOD_TYPES.includes(foodType) ? [foodType] : null;
      }
      if (foodType) {
        foodType = foodType.filter(ft => FOOD_TYPES.includes(ft));
        if (foodType.length === 0) foodType = null;
      }

      const location = {
        type: 'Point',
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)],
      };

      await Restaurant.create({
        userId,
        name: place.name,
        category: place.amenity,
        foodType,
        description,
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
