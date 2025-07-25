import fs from 'fs/promises';
import path from 'path';
import csv from 'csvtojson';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addInitialData = async (req, res) => {
  try {
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      console.log('Admin user not found.');
      if (res) res.status(400).json({ message: 'Admin user not found' });
      return;
    }

    const csvPath = path.join(__dirname, '../data/restaurants.csv');
    const restaurants = await csv().fromFile(csvPath);

    const cleanedRestaurants = restaurants.map(r => ({
      ...r,
      foodType: r.foodType ? r.foodType.split(',').map(f => f.trim()) : [],
      photos: r.photos ? r.photos.split(',').map(p => p.trim()) : [],
      postalCode: r.postalCode ? parseInt(r.postalCode) : null,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      userId: admin.id,
    }));

    for (const r of cleanedRestaurants) {
      const existing = await Restaurant.findOne({ where: { name: r.name } });
      if (existing) {
        console.log(`Restaurant "${r.name}" already exists`);
        continue;
      }

      await Restaurant.create({
        ...r,
        location: {
          type: 'Point',
          coordinates: [r.longitude, r.latitude],
        },
      });
    }

    if (res) res.status(201).json({ message: 'Initial data added from CSV' });
  } catch (err) {
    console.error('Error adding data:', err);
    if (res) res.status(500).json({ message: err.message });
  }
};

const deleteData = async (req, res) => {
  try {
    await Review.destroy({ where: {} });
    await Restaurant.destroy({ where: {} });
    if (res) res.status(200).json({ message: 'All restaurants and related data deleted.' });
  } catch (err) {
    console.error('Error deleting data:', err);
    if (res) res.status(500).json({ message: err.message });
  }
};

export default { addInitialData, deleteData };
