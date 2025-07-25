import fetch from 'node-fetch';

const AMENITIES = ['restaurant', 'cafe', 'bar', 'pub', 'fast_food'];

export async function fetchPOIsFromOSM(cityName, countryName) {
  const query = `
    [out:json][timeout:25];
    area["name"="${cityName}"]->.searchArea;
    (
      ${AMENITIES.map(a => `node["amenity"="${a}"]["name"](area.searchArea);`).join('\n')}
      ${AMENITIES.map(a => `way["amenity"="${a}"]["name"](area.searchArea);`).join('\n')}
      ${AMENITIES.map(a => `relation["amenity"="${a}"]["name"](area.searchArea);`).join('\n')}
    );
    out center tags;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  const data = await response.json();

  const amenityToCategoryMap = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  pub: 'Pub',
  fast_food: 'Fast Food',
  };
 function parseCuisine(cuisineStr) {
  if (!cuisineStr) return [];

  return cuisineStr
    .replace(/_/g, ' ')       
    .split(/[;,]/)             
    .map(s => s.trim())       
    .filter(Boolean)          
    .map(s =>
      s
        .split(' ')       
        .map(word =>
          word
            .toLowerCase()   
            .replace(/^\w/, c => c.toUpperCase()) 
        )
        .join(' ')
    );
}
  const results = data.elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const street = el.tags['addr:street'] || '';
      const houseNumber = el.tags['addr:housenumber'] || '';
      const address = `${street} ${houseNumber}`.trim();
      const rawAmenity = el.tags.amenity || null;
      const category = rawAmenity ? amenityToCategoryMap[rawAmenity] || null : null;
      const cuisines = parseCuisine(el.tags.cuisine);

      return {
        name: el.tags.name,
        foodType: cuisines.length > 0 ? cuisines : null,
        amenity: category,
        address,
        description: el.tags.description,
        postalCode: el.tags['addr:postcode'] || null,
        city: cityName,
        country: countryName,
        lat: el.lat || el.center?.lat || null,
        lon: el.lon || el.center?.lon || null,
      };
    });

  console.log(`___Fetched____:  ${cityName}, ${countryName}, NUM: ${results.length}`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.amenity}) — ${r.address || 'unknown address'}`);
  });

  return results;
}
