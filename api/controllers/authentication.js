import passport from "passport";
import User from "../models/User.js";

/**
 * @openapi
 * /login:
 *  post:
 *   summary: Log in a user
 *   description: <b>Authenticate a user</b> and return a JWT token for access to protected resources.
 *   tags: [Authentication]
 *   requestBody:
 *    description: Login credentials
 *    required: true
 *    content:
 *     application/x-www-form-urlencoded:
 *      schema:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: <b>Username</b> of the registered user.
 *           example: john_doe
 *         password:
 *           type: string
 *           description: <b>Password</b> for the user account.
 *           example: secret123
 *   responses:
 *    '200':
 *     description: <b>OK</b>, with JWT token.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/AuthResponse'
 *    '401':
 *     description: <b>Unauthorized</b>, invalid credentials.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorMessage'
 *       example:
 *        message: Incorrect username or password.
 *    '500':
 *     description: <b>Internal Server Error</b>, with error message.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorMessage'
 *       example:
 *        message: Database not available.
 */
const login = (req, res) => {
     if (!req.body.username || !req.body.password)
      return res.status(400).json({ message: "All fields required." });
    else
      passport.authenticate("local", (err, user, info) => {
        if (err) return res.status(500).json({ message: err.message });
        if (user) return res.status(200).json({ token: user.generateJwt() });
        else return res.status(401).json({ message: info.message });
      })(req, res);
}

/**
 * @openapi
 * /register:
 *  post:
 *   summary: Register a new user
 *   description: <b>Create a new user account</b> with username, firstname, lastname, email, and password.
 *   tags: [Authentication]
 *   requestBody:
 *    description: User registration data
 *    required: true
 *    content:
 *     application/x-www-form-urlencoded:
 *      schema:
 *       type: object
 *       required:
 *         - username
 *         - firstname
 *         - lastname
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: <b>Unique username</b> for the user.
 *           example: johndoe
 *         firstname:
 *           type: string
 *           description: User's first name.
 *           example: John
 *         lastname:
 *           type: string
 *           description: User's last name.
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address.
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           description: Password for the account.
 *           example: secret123
 *   responses:
 *    '200':
 *     description: <b>OK</b>, user registered successfully, returns JWT token.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/AuthResponse'
 *    '400':
 *     description: <b>Bad Request</b>, missing or invalid input.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorMessage'
 *       example:
 *        message: All fields required.
 *    '409':
 *     description: <b>Conflict</b>, user already exists with same username or email.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorMessage'
 *       example:
 *        message: User with given e-mail address already registered.
 *    '500':
 *     description: <b>Internal Server Error</b>, database or server error.
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorMessage'
 *       example:
 *        message: Database not available.
 */
async function register ( req, res ) {
 const { username, email, password, firstname, lastname } = req.body;

  if (!username || !email || !password || !firstname || !lastname) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const emailRegex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email is already registered.",
      });
    }

    const user = User.build({
      username,
      email,
      firstname,
      lastname,
    });

    user.setPassword(password);
    await user.save();

    const token = user.generateJwt();
    return res.status(201).json({ token });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
export default {
    login,
    register,
}