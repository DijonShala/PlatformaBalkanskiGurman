import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20 * 1000,
});

const SYSTEM_PROMPT = `
    You extract structured restaurant data from YouTube video content.

    Only include restaurants located in one of these countries: Slovenia, Croatia, Bosnia and Herzegovina, Serbia, Montenegro, Kosovo, North Macedonia.

    Only return restaurants if the **name** and **address or city** are provided. Otherwise, return null.

    If multiple restaurants are present, return them as an array.

    Fields to extract:
    - name
    - description
    - category (must be one of):
    Cafe, Casual Dining, Fast Food, Fine Dining, Food Truck, Bakery, Bar, Bistro, Buffet, Canteen, Coffee Shop, Deli, Drive-Thru, Family Style, Gastropub, Pop-Up, Pub, Quick Service, Takeaway, Tea House, Pizzeria, Restaurant
    - foodType (e.g. Italian, Vegan, BBQ)
    - address, postalCode, city, country
    - latitude, longitude (only if clearly mentioned or confidently known)

    Return a clean JSON array or null. Use "" or null for unknown values. Do not include markdown or explanations.
`.trim();

/**
 * @param {{ title: string, description: string }} input
 * @returns {Promise<null | Array<Object>>}
 */
export async function analyzeVideo({ title, description }) {
  const userPrompt = `
    Here is a YouTube video:

    Title: ${title}
    Description: ${description}
`.trim();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  try {
    const response = completion.choices[0].message.content;
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) || parsed === null ? parsed : [parsed];
  } catch (err) {
    console.error('Filed to parse OpenAI response:', err.message);
    console.error('Raw response:', completion.choices[0].message.content);
    return null;
  }
}
