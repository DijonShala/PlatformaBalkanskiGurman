import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";
import jwt from "jsonwebtoken";
import { updateAverageRating } from "./restaurant.js";
import { updateUserSchema, changePasswordSchema } from "../middleware/joivalidate.js";
/**
 * @openapi
 * /users:
 *  get:
 *   summary: Get paginated users
 *   description: Retrieve paginated list of users. Admin access required.
 *   tags: [Users]
 *   security:
 *    - jwt: []
 *   parameters:
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
 *      description: Number of users per page
 *   responses:
 *    '200':
 *     description: <b>OK</b>, paginated list of users.
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
 *           $ref: '#/components/schemas/User'
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to fetch users.
 */
const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ["hash", "salt"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /user/{id}:
 *  get:
 *   summary: Get a specific user
 *   description: Retrieve user by ID. Admin or owner access required.
 *   tags: [Users]
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
 *     description: <b>OK</b>, user data.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         status:
 *          type: string
 *          example: OK
 *         data:
 *          $ref: '#/components/schemas/User'
 *    '404':
 *     description: <b>Not Found</b>, user not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to retrieve user.
 */
const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["hash", "salt"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ status: "OK", data: user });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * @openapi
 * /user/{id}:
 *  put:
 *   summary: Update user profile
 *   description: Update user details. Only self or admin can update the profile.
 *   tags: [Users]
 *   security:
 *    - jwt: []
 *   parameters:
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
 *        username:
 *         type: string
 *         example: new_username
 *        firstname:
 *         type: string
 *         example: John
 *        lastname:
 *         type: string
 *         example: Doe
 *        email:
 *         type: string
 *         format: email
 *         example: john.doe@example.com
 *        role:
 *         type: string
 *         example: admin
 *   responses:
 *    '200':
 *     description: <b>OK</b>, profile updated successfully.
 *    '400':
 *     description: <b>Bad Request</b>, invalid input or duplicate data.
 *    '401':
 *     description: <b>Unauthorized</b>, not allowed to update this profile.
 *    '404':
 *     description: <b>Not Found</b>, user not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to update profile.
 */
const updateProfile = async (req, res) => {
  const isAdmin = req.auth?.role === "admin";
  const id = isAdmin ? req.params.id : req.auth?.id;

  if (!id) {
    return res.status(400).json({ message: "User ID is missing." });
  }

  const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error.",
      details: error.details.map((detail) => detail.message),
    });
  }

  const { username, firstname, lastname, email, role } = value;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const updateFields = {};

    if (username !== undefined) updateFields.username = username;
    if (firstname !== undefined) updateFields.firstname = firstname;
    if (lastname !== undefined) updateFields.lastname = lastname;
    if (email !== undefined) updateFields.email = email;

    if (isAdmin && role !== undefined) {
      updateFields.role = role;
    } else if (!isAdmin && role !== undefined) {
      return res.status(403).json({ message: "Only admin can change roles." });
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    await user.update(updateFields);

    const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              firstname: user.firstname,
              role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
    );
    res.status(200).json({ message: "Profile updated successfully." , token});
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Username or email already in use." });
    }

    res.status(500).json({ message: err.message });
  }
};

/**
 * @openapi
 * /user/{id}/password:
 *  patch:
 *   summary: Change user password
 *   description: Change the password for the user. Only self-access is allowed unless admin.
 *   tags: [Users]
 *   security:
 *    - jwt: []
 *   parameters:
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
 *       required:
 *        - oldPassword
 *        - newPassword
 *       properties:
 *        oldPassword:
 *         type: string
 *         example: oldPass123
 *        newPassword:
 *         type: string
 *         minLength: 6
 *         example: newSecurePass456
 *   responses:
 *    '200':
 *     description: <b>OK</b>, password updated successfully.
 *    '400':
 *     description: <b>Bad Request</b>, missing or invalid fields.
 *    '401':
 *     description: <b>Unauthorized</b>, incorrect old password or unauthorized user.
 *    '404':
 *     description: <b>Not Found</b>, user not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to update password.
 */
const changePassword = async (req, res) => {
  const isAdmin = req.auth?.role === "admin";
  const id = isAdmin ? req.params.id : req.auth.id;

  if (!id) {
    return res.status(400).json({ message: "User ID is missing." });
  }

  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error.",
      details: error.details.map((detail) => detail.message),
    });
  }

  const { oldPassword, newPassword } = value;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isValid = user.validPassword(oldPassword);
    if (!isValid) {
      return res.status(401).json({ message: "Incorrect old password." });
    }

    user.setPassword(newPassword);
    await user.save();

      const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              firstname: user.firstname,
              role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

    return res.status(200).json({ message: "Password updated successfully." , token });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};


/**
 * @openapi
 * /user/{id}:
 *  delete:
 *   summary: Delete a user account
 *   description: Delete a user. Fails if user has associated restaurants or reviews.
 *   tags: [Users]
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
 *     description: <b>OK</b>, user deleted successfully.
 *    '400':
 *     description: <b>Bad Request</b>, user has associated restaurants or reviews.
 *    '404':
 *     description: <b>Not Found</b>, user not found.
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to delete user.
 */
const deleteProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurants'
        },
        {
          model: Review,
          as: 'reviews'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update average rating for each of user's restaurants before deleting them
    for (const restaurant of user.restaurants) {
      await updateAverageRating(restaurant.id);
    }

    await user.destroy(); // Assuming cascade delete is configured for related models
    return res.status(200).json({ message: "User deleted successfully" });

  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: err.message });
  }
};



export default {
    getAllUsers,
    getUser,
    updateProfile,
    changePassword,
    deleteProfile,
}
