import fetch from 'node-fetch';

const AMENITIES = ['restaurant', 'cafe', 'bar', 'pub', 'fast_food'];

export async function fetchPOIsFromOSM(cityName, countryName) {
  const query = `
    [out:json][timeout:25];
    area["name"="${cityName}"]->.searchArea;
    (
      ${AMENITIES.map(a => `node["amenity"="${a}"](area.searchArea);`).join('\n')}
      ${AMENITIES.map(a => `way["amenity"="${a}"](area.searchArea);`).join('\n')}
      ${AMENITIES.map(a => `relation["amenity"="${a}"](area.searchArea);`).join('\n')}
    );
    out center tags;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  const data = await response.json();

  const results = data.elements
    .filter((el) => el.tags?.name)
    .map((el) => ({
      name: el.tags.name,
      cuisine: el.tags.cuisine || null,
      amenity: el.tags.amenity || null,
      opening_hours: el.tags.opening_hours || null,
      phone: el.tags.phone || null,
      website: el.tags.website || null,
      street: el.tags['addr:street'] || null,
      housenumber: el.tags['addr:housenumber'] || null,
      postcode: el.tags['addr:postcode'] || null,
      city: cityName,
      country: countryName,
      lat: el.lat || el.center?.lat || null,
      lon: el.lon || el.center?.lon || null,
    }));

    console.log(`--- Fetched ${results.length} places in ${cityName}, ${countryName} ---`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.amenity}) — ${r.street || 'Unknown Street'}`);
  });

  return results;
}
