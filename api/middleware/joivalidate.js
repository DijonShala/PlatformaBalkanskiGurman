import Joi from "joi";
 
/**
  * User
  */
export const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  firstname: Joi.string().min(2).max(30),
  lastname: Joi.string().min(2).max(30),
  email: Joi.string().email(),
  role: Joi.string().valid("basic", "admin"),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

/**
 * Authenticate
 */
export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstname: Joi.string().min(1).max(50).required(),
  lastname: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Review
 */
export const reviewCreateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "any.required": "Rating is required.",
    "number.base": "Rating must be a number.",
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating must not exceed 5."
  }),
  comment: Joi.string().allow("", null),
  photos: Joi.array().items(Joi.string().uri()).messages({
    "string.uri": "Each photo must be a valid URL."
  })
});

export const reviewUpdateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).messages({
    "number.base": "Rating must be a number.",
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating must not exceed 5."
  }),
  comment: Joi.string().allow("", null),
  photos: Joi.array().items(Joi.string().uri()).messages({
    "string.uri": "Each photo must be a valid URL."
  })
}).or("rating", "comment", "photos").messages({
  "object.missing": "At least one field must be provided for update."
});

/**
 * Restaurant
 */
export const createRestaurantSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().required(),
  foodType: Joi.alternatives().try(
  Joi.string(),
  Joi.array().items(Joi.string())
  ).optional(),
  description: Joi.string().optional(),
  address: Joi.string().optional(),
  postalCode: Joi.number().optional(),
  city: Joi.string().required(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  country: Joi.string().required(),
  photos: Joi.array().items(Joi.string().uri()).optional().allow(null),
});

export const updateRestaurantSchema = Joi.object({
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  foodType: Joi.alternatives().try(
  Joi.string(),
  Joi.array().items(Joi.string())
  ).optional(),
  description: Joi.string().optional(),
  address: Joi.string().optional(),
  postalCode: Joi.number().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  photos: Joi.array().items(Joi.string().uri()).optional(),
});