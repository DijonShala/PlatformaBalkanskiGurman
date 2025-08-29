import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

class User extends Model {
  setPassword(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto
      .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
      .toString('hex');
  }

  validPassword(password) {
    const hash = crypto
      .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
      .toString('hex');
    return this.hash === hash;
  }

  generateJwt() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        firstname: this.firstname,
        role: this.role,
        exp: Math.floor(expiry.getTime() / 1000),
      },
      process.env.JWT_SECRET
    );
  }
}

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: A registered user of the system.
 *       properties:
 *         id:
 *           type: integer
 *           description: <b>Unique identifier</b> for the user.
 *           example: 1
 *         username:
 *           type: string
 *           description: <b>Unique username</b> used for login.
 *           example: john_doe
 *         firstname:
 *           type: string
 *           description: User’s <b>first name</b>.
 *           example: John
 *         lastname:
 *           type: string
 *           description: User’s <b>last name</b>.
 *           example: Doe
 *         role:
 *           type: string
 *           description: User’s <b>role</b> in the system.
 *           enum: [admin, basic]
 *           example: basic
 *         email:
 *           type: string
 *           format: email
 *           description: User’s <b>email address</b>.
 *           example: john.doe@example.com
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was created.
 *           example: 2025-07-09T14:33:21.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was last updated.
 *           example: 2025-07-09T16:47:00.000Z
 *       required:
 *         - id
 *         - username
 *         - firstname
 *         - lastname
 *         - role
 *         - email
 */
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [3, 255],
          msg: 'Username must be between 3 and 50 characters',
        },
        is: {
          args: /^[a-zA-Z0-9_]+$/i,
          msg: 'Username can only contain letters, numbers, and underscores',
        },
      },
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [1, 255],
          msg: 'First name must be between 1 and 50 characters',
        },
      },
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [1, 255],
          msg: 'Last name must be between 1 and 50 characters',
        },
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'basic'),
      allowNull: false,
      defaultValue: 'basic',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
