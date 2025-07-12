import Restaurant from "../models/Restaurant.js";
import { Op, fn, col, literal } from "sequelize";
import { sequelize } from "../models/db.js";
import Review from "../models/Review.js";

/**
 * @openapi
 * /restaurants:
 *  get:
 *   summary: Get all restaurants
 *   description: Retrieve a list of all restaurants from the database.
 *   tags: [Restaurants]
 *   responses:
 *    '200':
 *     description: <b>OK</b>, restaurants fetched successfully.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to retrieve restaurants.
 */
const allRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll();
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/{id}:
 *  get:
 *   summary: Get a restaurant by ID
 *   description: Fetch a single restaurant using its unique ID.
 *   tags: [Restaurants]
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: integer
 *   responses:
 *    '200':
 *     description: <b>OK</b>, restaurant retrieved successfully.
 *    '404':
 *     description: <b>Not Found</b>, restaurant not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to fetch restaurant.
 */
const oneRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findOne({ where: { id } });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    res.status(200).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     description: Add a new restaurant with all necessary information. Authentication required. The userId is obtained from the JWT.
 *     tags:
 *       - Restaurants
 *     security:
 *       - jwt: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *               - address
 *               - city
 *               - country
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Krištof Restaurant"
 *               category:
 *                 type: string
 *                 example: "Fine Dining"
 *               foodType:
 *                 type: string
 *                 example: "Mediterranean-Slovenian"
 *               description:
 *                 type: string
 *                 example: "Modern Mediterranean cuisine with Slovenian flair and local wines."
 *               latitude:
 *                 type: number
 *                 format: double
 *                 example: 46.298262
 *                 description: Latitude in WGS-84.
 *               longitude:
 *                 type: number
 *                 format: double
 *                 example: 14.485361
 *                 description: Longitude in WGS-84.
 *               address:
 *                 type: string
 *                 example: "Predoslje 22, 4000 Kranj"
 *               city:
 *                 type: string
 *                 example: "Ljubljana"
 *               country:
 *                 type: string
 *                 example: "Slovenia"
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example:
 *                   - "https://example.com/photo10.jpg"
 *     responses:
 *       '201':
 *         description: <b>Created</b>, restaurant successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Created
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       '400':
 *         description: <b>Bad Request</b>, validation error or missing input.
 *       '401':
 *         description: <b>Unauthorized</b>, authentication required.
 *       '500':
 *         description: <b>Internal Server Error</b>, could not create restaurant.
 */
const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      category,
      foodType,
      description,
      latitude,
      longitude,
      address,
      city,
      country,
      photos,
    } = req.body;

    if (!req.auth.id || !name || !latitude || !longitude || !address || !city || !country) {
      return res.status(400).json({
        message: "Missing required fields: userId, name, latitude, longitude, address, or country.",
      });
    }

    const location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };

    const newRestaurant = await Restaurant.create({
      userId: req.auth.id,
      name,
      category: category || null,
      foodType: foodType || null,
      description: description || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location,
      address,
      city,
      country,
      photos: photos || null,
    });

    res.status(201).json(newRestaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
/**
 * @openapi
 * /restaurants/{id}:
 *   put:
 *     summary: Update a restaurant
 *     description: Update one or more fields of a restaurant. Authentication required.
 *     tags:
 *       - Restaurants
 *     security:
 *       - jwt: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Hippo Diner"
 *               address:
 *                 type: string
 *                 example: "100 Safari Drive, Nairobi"
 *               latitude:
 *                 type: number
 *                 format: double
 *                 example: -1.3000
 *                 description: Latitude in WGS-84
 *               longitude:
 *                 type: number
 *                 format: double
 *                 example: 36.8000
 *                 description: Longitude in WGS-84
 *               category:
 *                 type: string
 *                 example: "Fine Dining"
 *               foodType:
 *                 type: string
 *                 example: "Fusion"
 *               country:
 *                 type: string
 *                 example: "Kenya"
 *               city:
 *                 type: string
 *                 example: "Nairobi"
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 examples:
 *                   updatedPhotos:
 *                     summary: Updated photo URLs
 *                     value: ["https://cdn.example.com/photos/updated1.jpg", "https://cdn.example.com/photos/updated2.jpg"]
 *     responses:
 *       '200':
 *         description: <b>OK</b>, restaurant updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Updated
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       '400':
 *         description: <b>Bad Request</b>, invalid or missing input.
 *       '401':
 *         description: <b>Unauthorized</b>, authentication required.
 *       '404':
 *         description: <b>Not Found</b>, restaurant not found.
 *       '500':
 *         description: <b>Internal Server Error</b>, update failed.
 */
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      foodType,
      description,
      latitude,
      longitude,
      address,
      city,
      country,
      photos,
    } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const updatedFields = {};

    if (req.auth.id !== undefined) updatedFields.userId = req.auth.id;
    if (name !== undefined) updatedFields.name = name;
    if (category !== undefined) updatedFields.category = category;
    if (foodType !== undefined) updatedFields.foodType = foodType;
    if (description !== undefined) updatedFields.description = description;
    if (latitude !== undefined) updatedFields.latitude = parseFloat(latitude);
    if (longitude !== undefined) updatedFields.longitude = parseFloat(longitude);
    if (address !== undefined) updatedFields.address = address;
    if (city !== undefined) updatedFields.city = city;
    if (country !== undefined) updatedFields.country = country;
    if (photos !== undefined) updatedFields.photos = photos;

    if (latitude !== undefined && longitude !== undefined) {
      updatedFields.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await restaurant.update(updatedFields);

    res.status(200).json({ message: "Restaurant updated", restaurant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/{id}:
 *  delete:
 *   summary: Delete a restaurant
 *   description: Permanently delete a restaurant by its ID.
 *   tags: [Restaurants]
 *   security:
 *    - jwt: []
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: integer
 *   responses:
 *    '200':
 *     description: <b>OK</b>, restaurant deleted.
 *    '404':
 *     description: <b>Not Found</b>, restaurant not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to delete.
 */
const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Restaurant.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    res.status(200).json({ message: "Restaurant deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants:
 *  delete:
 *   summary: Delete all restaurants
 *   description: Permanently delete all restaurants from the database.
 *   tags: [Restaurants]
 *   security:
 *    - jwt: []
 *   responses:
 *    '200':
 *     description: <b>OK</b>, all restaurants deleted.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to delete all restaurants.
 */
const deleteAllRestaurants = async (req, res) => {
  try {
    await Restaurant.destroy({ where: {} });
    res.status(200).json({ message: "All restaurants deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/filter:
 *  get:
 *   summary: Filter restaurants
 *   description: Filter restaurants by category, food type, country, tags, or name.
 *   tags: [Restaurants]
 *   parameters:
 *    - in: query
 *      name: category
 *      schema:
 *       type: string
 *    - in: query
 *      name: foodType
 *      schema:
 *       type: string
 *    - in: query
 *      name: country
 *      schema:
 *       type: string
 *    - in: query  
 *      name: city
 *      schema:
 *       type: string
 *    - in: query
 *      name: name
 *      schema:
 *       type: string
 *    - in: query
 *      name: nResults
 *      schema:
 *       type: integer
 *   responses:
 *    '200':
 *     description: <b>OK</b>, filtered restaurants returned.
 *    '404':
 *     description: <b>Not Found</b>, no matching restaurants.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to filter.
 */
const filterRestaurants = async (req, res) => {
  try {
    const { category, foodType, country, city, name } = req.query;
    let nResults = parseInt(req.query.nResults);
    nResults = isNaN(nResults) ? 10 : nResults;

    let whereClause = {};
    if (category) whereClause.category = category;
    if (foodType) whereClause.foodType = foodType;
    if (country) whereClause.country = country;
    if (city) whereClause.city = city;
    if (name) whereClause.name = { [Op.iLike]: `%${name}%` };


    const results = await Restaurant.findAll({
      where: whereClause,
      limit: nResults,
      order: [["createdAt", "DESC"]],
    });

    if (!results.length) {
      return res.status(404).json({ message: "No restaurants found." });
    }

    res.status(200).json({ status: "OK", data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/codelist/{codelist}:
 *  get:
 *   summary: Get distinct values for a field
 *   description: Get all unique values for a specified codelist field (category, foodType, country).
 *   tags: [Restaurants]
 *   parameters:
 *    - in: path
 *      name: codelist
 *      required: true
 *      schema:
 *       type: string
 *       enum: [category, foodType, country, city]
 *   responses:
 *    '200':
 *     description: <b>OK</b>, list of distinct values.
 *    '400':
 *     description: <b>Bad Request</b>, invalid codelist field.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to retrieve list.
 */
const allowedCodelists = ["category", "foodType", "country", "city"];

const listCodelistValues = async (req, res) => {
  const field = req.params.codelist;

  if (!allowedCodelists.includes(field)) {
    return res.status(400).json({
      message: `Parameter 'codelist' must be one of: ${allowedCodelists.join(", ")}`,
    });
  }

  try {
    const values = await Restaurant.findAll({
      attributes: [[fn("DISTINCT", col(field)), field]],
      raw: true,
    });

    const list = values.map((v) => v[field]).filter(Boolean);

    res.status(200).json({ status: "OK", data: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/distance:
 *  get:
 *   summary: Get nearby restaurants
 *   description: Find restaurants near a specific latitude and longitude.
 *   tags: [Restaurants]
 *   parameters:
 *    - in: query
 *      name: lat
 *      required: true
 *      schema:
 *       type: number
 *    - in: query
 *      name: lng
 *      required: true
 *      schema:
 *       type: number
 *    - in: query
 *      name: maxDistance
 *      schema:
 *       type: number
 *    - in: query
 *      name: nResults
 *      schema:
 *       type: integer
 *   responses:
 *    '200':
 *     description: <b>OK</b>, nearby restaurants retrieved.
 *    '400':
 *     description: <b>Bad Request</b>, missing or invalid location input.
 *    '404':
 *     description: <b>Not Found</b>, no nearby restaurants.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to process.
 */
function formatDistance(meters) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

const getRestaurantsByDistance = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const maxDistance = parseFloat(req.query.maxDistance);
  const nResults = parseInt(req.query.nResults);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: "Query parameters 'lat' and 'lng' are required and must be valid numbers.",
    });
  }

  const distance = isNaN(maxDistance) ? 5000 : maxDistance; // default 5 km
  const limit = isNaN(nResults) ? 10 : nResults;

  try {
    const restaurants = await Restaurant.findAll({
      attributes: {
        include: [
          [
            literal(`
              ST_Distance(
                location,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
              )
            `),
            "rawDistance",
          ],
        ],
      },
      where: sequelize.where(
        literal(`
          ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${distance}
          )
        `),
        true
      ),
      order: literal(`
        location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      `),
      limit,
      raw: true,
    });

    if (!restaurants.length) {
      return res.status(404).json({ message: "No restaurants found nearby." });
    }

    const formatted = restaurants.map((r) => ({
      ...r,
      distance: formatDistance(r.rawDistance),
    }));

    return res.status(200).json({ status: "OK", data: formatted });
  } catch (err) {
    console.error("Error fetching restaurants by distance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAverageRating = async (restaurantId) => {
  try {
    const reviews = await Review.findAll({
      where: { restaurantId },
      attributes: ["rating"],
    });

    if (reviews.length === 0) {
      await Restaurant.update({ rating: 0 }, { where: { id: restaurantId } });
      return;
    }

    const total = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0);
    const average = total / reviews.length;

    await Restaurant.update(
      { rating: average.toFixed(1) },
      { where: { id: restaurantId } }
    );

    console.log(`Updated avg rating for restaurant ${restaurantId}: ${average.toFixed(1)}`);
  } catch (err) {
    console.error("Error updating average rating:", err);
  }
};

export default {
  allRestaurants,
  oneRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  deleteAllRestaurants,
  filterRestaurants,
  getRestaurantsByDistance,
  listCodelistValues,
};
