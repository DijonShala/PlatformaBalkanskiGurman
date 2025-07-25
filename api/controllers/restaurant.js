import Restaurant from "../models/Restaurant.js";
import { Op, fn, col, literal } from "sequelize";
import { sequelize } from "../models/db.js";
import Review from "../models/Review.js";
import { createRestaurantSchema, updateRestaurantSchema } from "../middleware/joivalidate.js";
import axios from "axios";
import streamifier from "streamifier";
import cloudinary from "./cloudinary.js";

/**
 * @openapi
 * /restaurants:
 *  get:
 *   summary: Get paginated list of restaurants
 *   description: Retrieve a paginated list of restaurants from the database. Use query parameters to control page and limit.
 *   tags: [Restaurants]
 *   parameters:
 *    - in: query
 *      name: page
 *      schema:
 *        type: integer
 *        default: 1
 *      description: Page number (1-based index)
 *    - in: query
 *      name: limit
 *      schema:
 *        type: integer
 *        default: 10
 *      description: Number of items per page
 *   responses:
 *    '200':
 *     description: <b>OK</b>, restaurants fetched successfully.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         currentPage:
 *          type: integer
 *          example: 1
 *         totalPages:
 *          type: integer
 *          example: 5
 *         totalItems:
 *          type: integer
 *          example: 50
 *         restaurants:
 *          type: array
 *          items:
 *           $ref: '#/components/schemas/Restaurant'
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to retrieve restaurants.
 */
const allRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default 10 items per page
    const offset = (page - 1) * limit;

    const { count, rows: restaurants } = await Restaurant.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']], // Optional: order by newest first
    });

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: restaurants,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/user/{id}:
 *  get:
 *   summary: Get paginated list of restaurants created by a specific user
 *   description: Retrieve a paginated list of restaurants created by the user with the given ID.
 *   tags: [Restaurants]
 *   parameters:
 *    - in: path
 *      name: id
 *      schema:
 *        type: string
 *      required: true
 *      description: User ID to filter restaurants by
 *    - in: query
 *      name: page
 *      schema:
 *        type: integer
 *        default: 1
 *      description: Page number (1-based index)
 *    - in: query
 *      name: limit
 *      schema:
 *        type: integer
 *        default: 10
 *      description: Number of items per page
 *   responses:
 *    '200':
 *     description: <b>OK</b>, restaurants fetched successfully.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         currentPage:
 *          type: integer
 *          example: 1
 *         totalPages:
 *          type: integer
 *          example: 5
 *         totalItems:
 *          type: integer
 *          example: 50
 *         data:
 *          type: array
 *          items:
 *           $ref: '#/components/schemas/Restaurant'
 *    '403':
 *     description: <b>Forbidden</b>, user not authorized to access this data.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to retrieve restaurants.
 */
const restaurantsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: restaurants } = await Restaurant.findAndCountAll({
      where: { userId },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: restaurants,
    });
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
 *     description: >
 *       Add a new restaurant with all necessary information.
 *       Authentication required. The userId is obtained from the JWT.
 *       Latitude and longitude are obtained automatically by geocoding the address fields.
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
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 example: ["Mediterranean", "Slovenian"]
 *               description:
 *                 type: string
 *                 example: "Modern Mediterranean cuisine with Slovenian flair and local wines."
 *               address:
 *                 type: string
 *                 example: "Predoslje 22"
 *               postalCode:
 *                 type: string
 *                 example: "4000"
 *               city:
 *                 type: string
 *                 example: "Kranj"
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
 *         description: <b>Bad Request</b>, validation error or unable to geocode address.
 *       '401':
 *         description: <b>Unauthorized</b>, authentication required.
 *       '500':
 *         description: <b>Internal Server Error</b>, could not create restaurant.
 */

const createRestaurant = async (req, res) => {
  try {
    // Validate input
    const { error, value } = createRestaurantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      name,
      category,
      foodType,
      description,
      address,
      postalCode,
      city,
      country,
      latitude,
      longitude
    } = value;

    // Check authentication
    if (!req.auth?.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Check if restaurant with same name + city already exists for same user
    const existing = await Restaurant.findOne({
      where: {
        name,
        city,
      },
    });

    if (existing) {
      return res.status(409).json({
        message: `A restaurant named "${name}" already exists in "${city}".`,
      });
    }

    // Geolocation
    let location;
    if (latitude && longitude) {
      location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    } else {
      const fullQuery = [address, postalCode, city, country].filter(Boolean).join(", ");

      const geoRes = await axios.get("https://geocode.maps.co/search", {
        params: {
          q: fullQuery,
          api_key: process.env.GEOCODE_API_KEY,
        },
      });

      if (!geoRes.data || geoRes.data.length === 0) {
        return res.status(400).json({
          message: "Unable to geocode address. Please check the provided location.",
        });
      }

      const { lat, lon } = geoRes.data[0];
      location = {
        type: "Point",
        coordinates: [parseFloat(lon), parseFloat(lat)],
      };
    }

    // Optional photo uploads
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      console.log("FILES RECEIVED:", req.files.length);
      const uploads = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "restaurant_photos" },
            (error, result) => {
              if (result) resolve(result.secure_url);
              else reject(error);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      });

      photoUrls = await Promise.all(uploads);
    }

    // Normalize foodType
    const normalizedFoodType = Array.isArray(foodType)
      ? foodType
      : typeof foodType === 'string'
      ? [foodType]
      : [];

    // Create new restaurant
    const newRestaurant = await Restaurant.create({
      userId: req.auth.id,
      name,
      category: category || null,
      foodType: normalizedFoodType,
      description: description || null,
      location,
      address,
      postalCode,
      city,
      country,
      photos: photoUrls,
    });

    return res.status(201).json({
      status: "Created",
      data: newRestaurant,
    });
  } catch (err) {
    console.error("Create restaurant error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/{id}:
 *   put:
 *     summary: Update a restaurant
 *     description: >
 *       Update one or more fields of a restaurant. Authentication required.
 *       If address fields are updated, latitude and longitude are automatically
 *       re-obtained by geocoding the new address.
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
 *                 example: "100 Safari Drive"
 *               postalCode:
 *                 type: string
 *                 example: "00100"
 *               city:
 *                 type: string
 *                 example: "Nairobi"
 *               country:
 *                 type: string
 *                 example: "Kenya"
 *               category:
 *                 type: string
 *                 example: "Fine Dining"
 *               foodType:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 example: ["Fusion", "Local"]
 *               description:
 *                 type: string
 *                 example: "Delicious fusion food with local flavors."
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
 *         description: <b>Bad Request</b>, invalid or missing input or unable to geocode updated address.
 *       '401':
 *         description: <b>Unauthorized</b>, authentication required.
 *       '404':
 *         description: <b>Not Found</b>, restaurant not found.
 *       '500':
 *         description: <b>Internal Server Error</b>, update failed.
 */

const updateRestaurant = async (req, res) => {
  try {
    // Parse postalCode if present and a string
    if (req.body.postalCode && typeof req.body.postalCode === "string") {
      req.body.postalCode = req.body.postalCode.trim();
    }

    const { error, value } = updateRestaurantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;

    // Find restaurant by PK
    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Destructure validated values
    const {
      name,
      category,
      foodType,
      description,
      address,
      postalCode,
      city,
      country,
      photos,
    } = value;

    const updatedFields = {};

    if (name !== undefined) updatedFields.name = name;
    if (category !== undefined) {
      updatedFields.category = category;
    }
    if (foodType !== undefined) {
      updatedFields.foodType = Array.isArray(foodType)
        ? foodType
        : typeof foodType === "string"
        ? [foodType]
        : [];
    }
    if (description !== undefined) updatedFields.description = description;
    if (address !== undefined) updatedFields.address = address;
    if (postalCode !== undefined) updatedFields.postalCode = postalCode;
    if (city !== undefined) updatedFields.city = city;
    if (country !== undefined) updatedFields.country = country;

    // Handle photo uploads if files are sent
    let newPhotoUrls = [];

    if (req.files && req.files.length > 0) {
      const uploads = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "restaurant_photos" },
            (error, result) => {
              if (result) resolve(result.secure_url);
              else reject(error);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      });

      newPhotoUrls = await Promise.all(uploads);
      updatedFields.photos = newPhotoUrls; // Replace existing photos
    } else if (photos !== undefined) {
      // Replace photos if sent directly in JSON
      updatedFields.photos = photos;
    }

    // If any address component changed, update geolocation
    if (
      address !== undefined ||
      postalCode !== undefined ||
      city !== undefined ||
      country !== undefined
    ) {
      const addressParts = [
        address !== undefined ? address : restaurant.address,
        postalCode !== undefined ? postalCode : restaurant.postalCode,
        city !== undefined ? city : restaurant.city,
        country !== undefined ? country : restaurant.country,
      ].filter(Boolean);

      const fullQuery = addressParts.join(", ");

      const geoRes = await axios.get("https://geocode.maps.co/search", {
        params: {
          q: fullQuery,
          api_key: process.env.GEOCODE_API_KEY,
        },
      });

      if (!geoRes.data || geoRes.data.length === 0) {
        return res.status(400).json({
          message: "Unable to geocode address. Please check the provided location.",
        });
      }

      const { lat, lon } = geoRes.data[0];

      updatedFields.location = {
        type: "Point",
        coordinates: [parseFloat(lon), parseFloat(lat)],
      };
    }

    // Update restaurant record in DB
    await restaurant.update(updatedFields);

    res.status(200).json({
      status: "Updated",
      data: restaurant,
    });
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
 *   summary: Filter restaurants with pagination
 *   description: >
 *     Filter restaurants by category, food type (single cuisine), country, city, or name with pagination support.
 *     Note: `foodType` matches any restaurant that includes the specified cuisine in its food type array.
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
 *      description: A single cuisine name (e.g. `Italian`, `Balkan`)
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
 *      name: page
 *      schema:
 *       type: integer
 *       default: 1
 *      description: Page number (1-based)
 *    - in: query
 *      name: limit
 *      schema:
 *       type: integer
 *       default: 10
 *      description: Number of items per page
 *   responses:
 *    '200':
 *     description: <b>OK</b>, filtered restaurants returned.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         currentPage:
 *          type: integer
 *          example: 1
 *         totalPages:
 *          type: integer
 *          example: 3
 *         totalItems:
 *          type: integer
 *          example: 25
 *         data:
 *          type: array
 *          items:
 *           $ref: '#/components/schemas/Restaurant'
 *    '404':
 *     description: <b>Not Found</b>, no matching restaurants.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to filter.
 */
const filterRestaurants = async (req, res) => {
  try {
    const { category, foodType, country, city, name } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (category) whereClause.category = category;
    if (foodType) {
      whereClause.foodType = {
        [Op.contains]: [foodType]
      };
    }
    if (country) whereClause.country = country;
    if (city) whereClause.city = city;
    if (name) whereClause.name = { [Op.iLike]: `%${name}%` };

    const { count, rows: results } = await Restaurant.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    if (!results.length) {
      return res.status(404).json({ message: "No restaurants found." });
    }

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/codelist/{codelist}:
 *  get:
 *   summary: Get distinct values for a field
 *   description: |
 *     Get all unique values for a specified codelist field.
 *     
 *     - `category`: Top-level category of restaurant
 *     - `foodType`: Unique cuisines (flattened from array)
 *     - `country`: Country name
 *     - `city`: City name
 *   tags: [Restaurants]
 *   parameters:
 *    - in: path
 *      name: codelist
 *      required: true
 *      schema:
 *       type: string
 *       enum: [category, foodType, country, city]
 *      description: Name of the field to get unique values for.
 *   responses:
 *    '200':
 *     description: <b>OK</b>, list of distinct values.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         status:
 *          type: string
 *          example: OK
 *         data:
 *          type: array
 *          items:
 *           type: string
 *          example: ["Balkan", "Seafood", "Italian"]
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
    let list = [];

    if (field === "foodType") {
      const records = await Restaurant.findAll({
        attributes: ["foodType"],
        raw: true,
      });

      const flat = records
        .flatMap(r => Array.isArray(r.foodType) ? r.foodType : [])
        .filter(Boolean);

      list = [...new Set(flat)];
    } else {
      const values = await Restaurant.findAll({
        attributes: [[fn("DISTINCT", col(field)), field]],
        raw: true,
      });

      list = values.map(v => v[field]).filter(Boolean);
    }

    res.status(200).json({ status: "OK", data: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/distance:
 *  get:
 *   summary: Get nearby restaurants with pagination
 *   description: Find restaurants near a specific latitude and longitude with pagination support.
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
 *       description: Maximum distance in meters (default 5000)
 *    - in: query
 *      name: page
 *      schema:
 *       type: integer
 *       default: 1
 *      description: Page number (1-based)
 *    - in: query
 *      name: limit
 *      schema:
 *       type: integer
 *       default: 10
 *      description: Number of items per page
 *   responses:
 *    '200':
 *     description: <b>OK</b>, nearby restaurants retrieved with pagination.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         currentPage:
 *          type: integer
 *         totalPages:
 *          type: integer
 *         totalItems:
 *          type: integer
 *         data:
 *          type: array
 *          items:
 *           type: object
 *           properties:
 *            id:
 *             type: integer
 *            name:
 *             type: string
 *            rawDistance:
 *             type: number
 *             description: Distance in meters (raw, unformatted)
 *    '400':
 *     description: <b>Bad Request</b>, missing or invalid location input.
 *    '404':
 *     description: <b>Not Found</b>, no nearby restaurants.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to process.
 */
const getRestaurantsByDistance = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const maxDistance = parseFloat(req.query.maxDistance);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: "Query parameters 'lat' and 'lng' are required and must be valid numbers.",
    });
  }

  const distance = isNaN(maxDistance) ? 5000 : maxDistance;

  try {
    // Count total matching restaurants for pagination
    const count = await Restaurant.count({
      where: sequelize.where(
        sequelize.literal(`
          ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${distance}
          )
        `),
        true
      ),
    });

    const restaurants = await Restaurant.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`
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
        sequelize.literal(`
          ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${distance}
          )
        `),
        true
      ),
      order: sequelize.literal(`
        location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      `),
      limit,
      offset,
      raw: true,
    });

    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: restaurants,
    });
  } catch (err) {
    console.error("Error fetching restaurants by distance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/restaurants/in-bounds:
 *   get:
 *     summary: Get restaurants within a bounding box
 *     tags:
 *       - Restaurants
 *     parameters:
 *       - in: query
 *         name: minLat
 *         schema:
 *           type: number
 *         required: true
 *         description: Minimum latitude (southwest corner)
 *       - in: query
 *         name: minLng
 *         schema:
 *           type: number
 *         required: true
 *         description: Minimum longitude (southwest corner)
 *       - in: query
 *         name: maxLat
 *         schema:
 *           type: number
 *         required: true
 *         description: Maximum latitude (northeast corner)
 *       - in: query
 *         name: maxLng
 *         schema:
 *           type: number
 *         required: true
 *         description: Maximum longitude (northeast corner)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         required: false
 *         description: Number of restaurants per page
 *     responses:
 *       200:
 *         description: A paginated list of restaurants in the bounding box
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Invalid bounding box coordinates
 *       500:
 *         description: Internal server error
 */
const getRestaurantsInBounds = async (req, res) => {
  const minLat = parseFloat(req.query.minLat);
  const minLng = parseFloat(req.query.minLng);
  const maxLat = parseFloat(req.query.maxLat);
  const maxLng = parseFloat(req.query.maxLng);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;  // adjust limit for your use case
  const offset = (page - 1) * limit;

  if (
    [minLat, minLng, maxLat, maxLng].some((v) => isNaN(v))
  ) {
    return res.status(400).json({ error: "Invalid bounding box coordinates" });
  }

  try {
    const count = await Restaurant.count({
      where: sequelize.where(
        sequelize.literal(`
          location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
        `),
        true
      ),
    });

    const restaurants = await Restaurant.findAll({
      where: sequelize.where(
        sequelize.literal(`
          location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
        `),
        true
      ),
      limit,
      offset,
      raw: true,
    });

    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: restaurants,
    });
  } catch (err) {
    console.error("Error fetching restaurants in bounds:", err);
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

/**
 * @openapi
 * /restaurants/search:
 *  get:
 *   summary: Search for restaurants by name with pagination
 *   description: Retrieve a paginated list of restaurants whose names match the provided query (case-insensitive).
 *   tags: [Restaurants]
 *   parameters:
 *    - in: query
 *      name: name
 *      required: true
 *      schema:
 *       type: string
 *      description: Name or partial name of the restaurant to search for.
 *    - in: query
 *      name: page
 *      schema:
 *       type: integer
 *       default: 1
 *      description: Page number (1-based)
 *    - in: query
 *      name: limit
 *      schema:
 *       type: integer
 *       default: 10
 *      description: Number of items per page
 *   responses:
 *    '200':
 *     description: A paginated list of matching restaurants.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         currentPage:
 *          type: integer
 *         totalPages:
 *          type: integer
 *         totalItems:
 *          type: integer
 *         data:
 *          type: array
 *          items:
 *           $ref: '#/components/schemas/Restaurant'
 *    '400':
 *     description: Missing required query parameter 'name'.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         message:
 *          type: string
 *          example: "Query parameter 'name' is required."
 *    '404':
 *     description: No restaurants found with that name.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         message:
 *          type: string
 *          example: "No restaurants found with that name."
 *    '500':
 *     description: Internal server error.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         message:
 *          type: string
 *          example: "Server error."
 */
const searchRestaurantByName = async (req, res) => {
  try {
    const { name } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!name) {
      return res.status(400).json({ message: "Query parameter 'name' is required." });
    }

    const { count, rows: restaurants } = await Restaurant.findAndCountAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`
        }
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    if (restaurants.length === 0) {
      return res.status(404).json({ message: "No restaurants found with that name." });
    }

    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: restaurants,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export default {
  allRestaurants,
  restaurantsByUserId,
  oneRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  deleteAllRestaurants,
  filterRestaurants,
  getRestaurantsByDistance,
  listCodelistValues,
  updateAverageRating,
  searchRestaurantByName,
  getRestaurantsInBounds
};