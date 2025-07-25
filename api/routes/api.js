import dotenv from 'dotenv';
dotenv.config();
import { Router } from 'express';
const router = Router();
import ctrlRestaurants from '../controllers/restaurant.js';
import ctrlReviews from '../controllers/review.js';
import ctrlDataB from '../controllers/initdb.js';
import ctrlUsers from '../controllers/user.js';
import ctrlAuthentication from '../controllers/authentication.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Review from '../models/Review.js';
import { isAdmin, isOwnerOrAdmin } from '../middleware/auth.js';
import { expressjwt as jwt } from 'express-jwt';
import upload from '../middleware/upload.js';

const auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload',
  algorithms: ['HS256'],
});

/**
 * Authentication
 */
router.post('/login', ctrlAuthentication.login);
router.post('/register', ctrlAuthentication.register);

/**
 * Profile management
 */
router.get('/users', auth, isAdmin, ctrlUsers.getAllUsers);
router.get('/user/:id', auth, isOwnerOrAdmin(User), ctrlUsers.getUser);
router.put('/user/:id', auth, isOwnerOrAdmin(User), ctrlUsers.updateProfile);
router.patch(
  '/user/:id/password',
  auth,
  isOwnerOrAdmin(User),
  ctrlUsers.changePassword
);
router.delete('/user/:id', auth, isOwnerOrAdmin(User), ctrlUsers.deleteProfile);

/**
 * Restaurant
 */
router.get('/restaurants/in-bounds', ctrlRestaurants.getRestaurantsInBounds);
router.get('/restaurants', ctrlRestaurants.allRestaurants);
router.get(
  '/restaurants/user/:id',
  auth,
  isOwnerOrAdmin(Restaurant),
  ctrlRestaurants.restaurantsByUserId
);
router.get('/restaurants/distance', ctrlRestaurants.getRestaurantsByDistance);
router.get('/restaurants/filter', ctrlRestaurants.filterRestaurants);
router.get('/restaurants/search/', ctrlRestaurants.searchRestaurantByName);
router.get('/restaurants/:id', ctrlRestaurants.oneRestaurant);
router.get(
  '/restaurants/codelist/:codelist',
  ctrlRestaurants.listCodelistValues
);
router.post(
  '/restaurants',
  auth,
  upload.array('restaurant_photos', 5),
  ctrlRestaurants.createRestaurant
);
router.put(
  '/restaurants/:id',
  auth,
  isOwnerOrAdmin(Restaurant),
  upload.array('restaurant_photos'),
  ctrlRestaurants.updateRestaurant
);
router.delete(
  '/restaurants',
  auth,
  isAdmin,
  ctrlRestaurants.deleteAllRestaurants
);
router.delete(
  '/restaurants/:id',
  auth,
  isOwnerOrAdmin(Restaurant),
  ctrlRestaurants.deleteRestaurant
);
/**
 * Review
 */
router.get('/restaurants/:idrest/reviews', ctrlReviews.getReviews);
router.get('/restaurants/:idrest/reviews/:id', ctrlReviews.getReview);
router.post(
  '/restaurants/:idrest/reviews',
  auth,
  upload.single('review_photo'),
  ctrlReviews.postReview
);
router.put(
  '/restaurants/:idrest/reviews/:id',
  auth,
  isOwnerOrAdmin(Review),
  ctrlReviews.updateReview
);
router.delete(
  '/restaurants/:idrest/reviews/:id',
  auth,
  isOwnerOrAdmin(Review),
  ctrlReviews.deleteReview
);

/**
 * Initial data (for testing)
 */
router
  .route('/db')
  .post(auth, isAdmin, ctrlDataB.addInitialData)
  .delete(auth, isAdmin, ctrlDataB.deleteData);

export default router;
