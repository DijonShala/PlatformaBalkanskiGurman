import fs from "fs/promises";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addInitialData = async (req, res) => {
  try {
    const admin = await User.findOne({ where: { email: "admin@example.com" } });
    if (!admin) {
      console.log("Admin user not found.");
      return;
    }

    const dataPath = path.join(__dirname, "../data/initRest.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const restaurants = JSON.parse(data);

    for (const r of restaurants) {
      const existing = await Restaurant.findOne({ where: { name: r.name } });
      if (existing) {
        console.log(`Restaurant "${r.name}" already exists`);
        continue;
      }

      const newRestaurant = await Restaurant.create({
        ...r,
        userId: admin.id,
        location: {
          type: "Point",
          coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
        },
      });

      console.log("Created restaurant:", newRestaurant.toJSON());
    }

    if (res) res.status(201).json({ message: "Initial data added" });
  } catch (err) {
    console.error("Error adding data:", err);
    if (res) res.status(500).json({ message: err.message });
  }
};

const deleteData = async (req, res) => {
  try {
    await Review.destroy({ where: {} });
    await Restaurant.destroy({ where: {} });
    res.status(200).json({ message: "All restaurants and related data deleted." });
  } catch (err) {
    console.error("Error deleting data:", err);
    res.status(500).json({ message: err.message });
  }
};

export default { addInitialData, deleteData };
