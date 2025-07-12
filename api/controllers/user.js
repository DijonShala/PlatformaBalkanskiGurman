import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";

/**
 * @openapi
 * /users:
 *  get:
 *   summary: Get all users
 *   description: Retrieve all users. Admin access required.
 *   tags: [Users]
 *   security:
 *    - jwt: []
 *   responses:
 *    '200':
 *     description: <b>OK</b>, list of users.
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
 *           $ref: '#/components/schemas/User'
 *    '500':
 *     description: <b>Internal Server Error</b>, failed to fetch users.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["hash", "salt"] },
    });
    res.status(200).json({ status: "OK", data: users });
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

  const { username, firstname, lastname, email, role } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const updateFields = {};

    if (username !== undefined) updateFields.username = username;
    if (firstname !== undefined) updateFields.firstname = firstname;
    if (lastname !== undefined) updateFields.lastname = lastname;
    if (email !== undefined) updateFields.email = email;

    if (req.auth?.role === 'admin' && role !== undefined) {
      updateFields.role = role;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }
    await user.update(updateFields);

    res.status(200).json({ message: "Profile updated successfully." });
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

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Old and new passwords are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long." });
  }

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

    return res.status(200).json({ message: "Password updated successfully." });
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
      include: [Restaurant, Review]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if ((user.Restaurants && user.Restaurants.length > 0) || (user.Reviews && user.Reviews.length > 0)) {
      return res.status(400).json({
        message: "Cannot delete user. User has associated restaurants."
      });
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export default {
    getAllUsers,
    getUser,
    updateProfile,
    changePassword,
    deleteProfile,
}
