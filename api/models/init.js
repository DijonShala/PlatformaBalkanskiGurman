import { sequelize } from "./db.js";
import Restaurant from './Restaurant.js';
import User from "./User.js";
import Review from "./Review.js";
import InitData from "../controllers/initdb.js"

export default async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true }); 
    console.log('Database synchronized');

    await InitData.addInitialData();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

