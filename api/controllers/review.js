import Review from "../models/Review.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import { updateAverageRating } from "./restaurant.js";

/**
 * @openapi
 * /restaurants/{idrest}/reviews:
 *  get:
 *   summary: Get all reviews for a restaurant
 *   description: Retrieve all reviews for a specific restaurant by its ID.
 *   tags: [Reviews]
 *   parameters:
 *    - in: path
 *      name: idrest
 *      required: true
 *      schema:
 *       type: integer
 *      description: Restaurant ID
 *   responses:
 *    '200':
 *     description: <b>OK</b>, list of reviews.
 *     content:
 *      application/json:
 *       schema:
 *        type: array
 *        items:
 *         $ref: '#/components/schemas/Review'
 *    '500':
 *     description: <b>Internal Server Error</b>, unable to fetch reviews.
 */
// GET all reviews for a restaurant
const getReviews = async (req, res) => {
  const { idrest } = req.params;
  try {
    const reviews = await Review.findAll({
      where: { restaurantId: idrest },
      include: [{ model: User, attributes: ["id", "username"] }],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ status: "OK", data: reviews });
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
// GET one review for a restaurant
const getReview = async (req, res) => {
  const { idrest, id } = req.params;
  try {
    const review = await Review.findOne({
      where: { id, restaurantId: idrest },
      include: [{ model: User, attributes: ["id", "username"] }],
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
// POST new review
const postReview = async (req, res) => {
  const { idrest } = req.params;
  const { rating, comment, photos } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const restaurant = await Restaurant.findByPk(idrest);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const newReview = await Review.create({
      restaurantId: idrest,
      userId: req.auth.id,
      rating,
      comment,
      photos: photos || null,
    });
    
    await updateAverageRating(idrest);

    res.status(201).json({ status: "Created", data: newReview });
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
  const { rating, comment, photos } = req.body;

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
