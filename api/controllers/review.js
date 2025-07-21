import Review from "../models/Review.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import { updateAverageRating } from "./restaurant.js";
import { reviewCreateSchema, reviewUpdateSchema } from "../middleware/joivalidate.js";
import streamifier from "streamifier";
import cloudinary from "./cloudinary.js";

/**
 * @openapi
 * /restaurants/{idrest}/reviews:
 *  get:
 *   summary: Get paginated reviews for a restaurant
 *   description: Retrieve paginated reviews for a specific restaurant by its ID.
 *   tags: [Reviews]
 *   parameters:
 *    - in: path
 *      name: idrest
 *      required: true
 *      schema:
 *       type: integer
 *      description: Restaurant ID
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
 *      description: Number of reviews per page
 *   responses:
 *    '200':
 *     description: <b>OK</b>, paginated list of reviews.
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
 *           $ref: '#/components/schemas/Review'
 *    '500':
 *     description: <b>Internal Server Error</b>, unable to fetch reviews.
 */
const getReviews = async (req, res) => {
  const { idrest } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { restaurantId: idrest },
      include: [{ model: User, as: 'user', attributes: ["id", "username"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/{idrest}/reviews/{id}:
 *  get:
 *   summary: Get a specific review for a restaurant
 *   description: Retrieve a review by its ID for a specific restaurant.
 *   tags: [Reviews]
 *   parameters:
 *    - in: path
 *      name: idrest
 *      required: true
 *      schema:
 *       type: integer
 *      description: Restaurant ID
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: integer
 *      description: Review ID
 *   responses:
 *    '200':
 *     description: <b>OK</b>, review found.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Review'
 *    '404':
 *     description: <b>Not Found</b>, review doesn't exist.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to retrieve review.
 */
const getReview = async (req, res) => {
  const { idrest, id } = req.params;
  try {
    const review = await Review.findOne({
      where: { id, restaurantId: idrest },
      include: [{ model: User, as: 'user', attributes: ["id", "username"] }],
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.status(200).json({ status: "OK", data: review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/{idrest}/reviews:
 *  post:
 *   summary: Create a review for a restaurant
 *   description: Add a new review for a specific restaurant. Authentication required.
 *   tags: [Reviews]
 *   security:
 *    - jwt: []
 *   parameters:
 *    - in: path
 *      name: idrest
 *      required: true
 *      schema:
 *       type: integer
 *      description: Restaurant ID
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *        rating:
 *         type: integer
 *         minimum: 1
 *         maximum: 5
 *         example: 4
 *        comment:
 *         type: string
 *         example: "Amazing food and vibe!"
 *        photos:
 *         type: array
 *         items:
 *          type: string
 *         example: ["https://cdn.example.com/photos/photo1.jpg", "https://cdn.example.com/photos/photo2.jpg"]
 *   responses:
 *    '201':
 *     description: <b>Created</b>, review successfully added.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         status:
 *          type: string
 *          example: Created
 *         data:
 *          $ref: '#/components/schemas/Review'
 *    '400':
 *     description: <b>Bad Request</b>, validation error (e.g., rating out of range).
 *    '401':
 *     description: <b>Unauthorized</b>, authentication required.
 *    '404':
 *     description: <b>Not Found</b>, restaurant not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, could not create review.
 */
const postReview = async (req, res) => {
  const { idrest } = req.params;

  const { error, value } = reviewCreateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error.",
      details: error.details.map((detail) => detail.message),
    });
  }

  const { rating, comment } = value;

  try {
    const restaurant = await Restaurant.findByPk(idrest);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

     let photoUrl = null;
    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'review_photos' },
          (error, result) => {
            if (result) resolve(result.secure_url);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      photoUrl = uploaded;
    }

    const newReview = await Review.create({
      restaurantId: idrest,
      userId: req.auth.id,
      rating,
      comment,
      photo: photoUrl,
    });

    await updateAverageRating(idrest);

    const createdWithUser = await Review.findByPk(newReview.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }
    });

    res.status(201).json({ status: "Created", data: createdWithUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * @openapi
 * /restaurants/{idrest}/reviews/{id}:
 *  put:
 *   summary: Update a review
 *   description: Update one or more fields of an existing review. At least one field is required. Authentication required.
 *   tags: [Reviews]
 *   security:
 *    - jwt: []
 *   parameters:
 *    - in: path
 *      name: idrest
 *      required: true
 *      schema:
 *       type: integer
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: integer
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        rating:
 *         type: integer
 *         minimum: 1
 *         maximum: 5
 *         example: 5
 *        comment:
 *         type: string
 *         example: Updated review comment.
 *        photos:
 *         type: array
 *         items:
 *          type: string
 *         example: ["https://image.url/photo1.jpg", "https://image.url/photo2.jpg"]
 *   responses:
 *    '200':
 *     description: <b>OK</b>, review updated successfully.
 *    '400':
 *     description: <b>Bad Request</b>, no fields provided or invalid input.
 *    '401':
 *     description: <b>Unauthorized</b>, auth failed.
 *    '404':
 *     description: <b>Not Found</b>, review not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, update failed.
 */

const updateReview = async (req, res) => {
  const { idrest, id } = req.params;

  const { error, value } = reviewUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error.",
      details: error.details.map((detail) => detail.message),
    });
  }

  const { rating, comment, photos } = value;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const review = await Review.findOne({
      where: { id, restaurantId: idrest },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    const updateFields = {};
    if (rating !== undefined) updateFields.rating = rating;
    if (comment !== undefined) updateFields.comment = comment;
    if (photos !== undefined) updateFields.photos = photos;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    await review.update(updateFields);

    await updateAverageRating(idrest);

    res.status(200).json({ message: "Review updated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/**
 * @openapi
 * /restaurants/{idrest}/reviews/{id}:
 *  delete:
 *   summary: Delete a review
 *   description: Delete a review by ID. Authentication required.
 *   tags: [Reviews]
 *   security:
 *    - jwt: []
 *   parameters:
 *    - in: path
 *      name: idrest
 *      required: true
 *      schema:
 *       type: integer
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: integer
 *   responses:
 *    '200':
 *     description: <b>OK</b>, review deleted successfully.
 *    '401':
 *     description: <b>Unauthorized</b>, authentication required.
 *    '404':
 *     description: <b>Not Found</b>, review doesn't exist.
 *    '500':
 *     description: <b>Internal Server Error</b>, deletion failed.
 */
const deleteReview = async (req, res) => {
  const { idrest, id } = req.params;

  try {
    const deleted = await Review.destroy({
      where: { id, restaurantId: idrest },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Review not found." });
    }

    await updateAverageRating(idrest);

    res.status(200).json({ message: "Review deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default {
  getReviews,
  getReview,
  postReview,
  updateReview,
  deleteReview,
};
