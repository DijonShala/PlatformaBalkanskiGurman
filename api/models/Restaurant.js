import { Model, DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import User from "./User.js";

const CATEGORIES = [
  "Cafe", "Casual Dining", "Fast Food", "Fine Dining", "Food Truck", "Bakery",
  "Bar", "Bistro", "Buffet", "Canteen", "Coffee Shop", "Deli", "Drive-Thru",
  "Family Style", "Gastropub", "Pop-Up", "Pub", "Quick Service", "Takeaway", "Tea House", "Pizzeria", "Restaurant"
];

const FOOD_TYPES = ["Slovenian", "Croatian", "Bosnian", "Serbian", "Montenegrin", "Macedonian", "Kosovar",
    "Balkan", "Yugoslav Fusion", "Bakery", "Barbecue", "Pizza", "Seafood", "Grill", "Mediterranean",
    "Middle Eastern", "Greek", "Turkish", "Italian", "Fusion", "Vegan", "Vegetarian", "Asian", "American",
    "French", "Chinese", "Indian", "Mexican"];
/**
 * @openapi
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       description: A single restaurant created by a registered user.
 *       properties:
 *         id:
 *           type: integer
 *           description: <b>Unique identifier</b> of the restaurant (auto‑incremented).
 *           example: 42
 *         userId:
 *           type: integer
 *           description: <b>ID of the user</b> who created the restaurant (foreign key).
 *           example: 7
 *         name:
 *           type: string
 *           description: <b>Restaurant name</b>.
 *           example: Krištof Restaurant
 *         category:
 *           type: string
 *           description: High‑level category.
 *           enum:
 *             - Cafe
 *             - Restaurant
 *             - Casual Dining
 *             - Fast Food
 *             - Fine Dining
 *             - Food Truck
 *             - Bakery
 *             - Bar
 *             - Bistro
 *             - Buffet
 *             - Canteen
 *             - Coffee Shop
 *             - Deli
 *             - Drive-Thru
 *             - Family Style
 *             - Gastropub
 *             - Pop-Up
 *             - Pub
 *             - Quick Service
 *             - Takeaway
 *             - Tea House
 *           example: Fine Dining
 *         foodType:
 *           type: array
 *           description: Cuisine or food style.
 *           items:
 *             type: string
 *           example: ["Bosnian", "Barbecue", "Coffee"]
 *         description:
 *           type: string
 *           description: Free‑text description.
 *           example: Modern Mediterranean cuisine with Slovenian flair and local wines.
 *         latitude:
 *           type: number
 *           format: double
 *           description: Latitude in WGS‑84.
 *           example: 46.298262
 *         longitude:
 *           type: number
 *           format: double
 *           description: Longitude in WGS‑84.
 *           example: 14.485361
 *         address:
 *           type: string
 *           description: Street address.
 *           example: Predoslje 22, 4000 Kranj
 *         city:
 *           type: string
 *           description: City name.
 *           example: Ljubljana
 *         country:
 *           type: string
 *           description: ISO country name.
 *           example: Slovenia
 *         photos:
 *           type: array
 *           description: Optional list of photo URLs.
 *           items:
 *             type: string
 *             format: uri
 *           example:
 *             - https://example.com/photo10.jpg
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           description: Average rating (computed from reviews).
 *           example: 4.7
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date of creation (ISO 8601).
 *           example: 2025-07-09T21:03:35.121Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the record was last updated.
 *           example: 2025-07-09T21:35:11.004Z
 *       required:
 *         - id
 *         - userId
 *         - name
 *         - latitude
 *         - longitude
 *         - city
 *         - country
 *         - rating
 *         - icon
 */
class Restaurant extends Model {}

Restaurant.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [CATEGORIES],
    },
  },
  foodType: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidFoodType(value) {
        if (!Array.isArray(value)) {
          throw new Error("foodType must be an array");
        }
        const invalidValues = value.filter(v => !FOOD_TYPES.includes(v));
        if (invalidValues.length > 0) {
          throw new Error(`Invalid foodType values: ${invalidValues.join(", ")}`);
        }
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.GEOGRAPHY("POINT", 4326),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  photos: {
  type: DataTypes.ARRAY(DataTypes.STRING),
  allowNull: true,
  defaultValue: [],
  },
  rating: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: "Restaurant",
  tableName: "restaurants",
  timestamps: true,
});

Restaurant.belongsTo(User, { foreignKey: "userId", as: 'user', onDelete: "CASCADE"});
User.hasMany(Restaurant, { foreignKey: "userId", as: 'restaurants', onDelete: "CASCADE"});

export default Restaurant;