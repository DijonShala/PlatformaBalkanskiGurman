import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db.js';
import Restaurant from './Restaurant.js';
import User from './User.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       description: A user submitted review for a specific restaurant.
 *       properties:
 *         id:
 *           type: integer
 *           description: <b>Unique identifier</b> of the review (auto‑incremented).
 *           example: 101
 *         userId:
 *           type: integer
 *           description: <b>ID of the user</b> who wrote the review.
 *           example: 7
 *         restaurantId:
 *           type: integer
 *           description: <b>ID of the restaurant</b> being reviewed.
 *           example: 42
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: <b>Rating</b> from 1 (worst) to 5 (best).
 *           example: 4
 *         comment:
 *           type: string
 *           description: Optional <b>text comment</b> by the reviewer.
 *           example: Great service and delicious food!
 *         photos:
 *           type: array
 *           description: Optional list of photo URLs submitted with the review.
 *           items:
 *             type: string
 *             format: uri
 *           example:
 *             - https://cloudinary.com/review-pictures1.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the review was created (ISO 8601).
 *           example: 2025-07-09T14:33:21.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the review was last updated.
 *           example: 2025-07-09T16:47:00.000Z
 *       required:
 *         - id
 *         - userId
 *         - restaurantId
 *         - rating
 */

class Review extends Model {}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'User ID must be an integer' },
        min: { args: [1], msg: 'User ID must be positive' },
      },
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Restaurant ID must be an integer' },
        min: { args: [1], msg: 'Restaurant ID must be positive' },
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Comment cannot exceed 1000 characters',
        },
      },
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
  }
);

Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});
User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

Review.belongsTo(Restaurant, {
  foreignKey: 'restaurantId',
  as: 'restaurants',
  onDelete: 'CASCADE',
});
Restaurant.hasMany(Review, {
  foreignKey: 'restaurantId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

export default Review;
