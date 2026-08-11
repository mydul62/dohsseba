import { Router } from 'express';
import * as bookingController from './booking.controller';
import { protect, optionalAuth, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createBookingValidator, updateStatusValidator } from './booking.validate';

const router = Router();

// Public / Guest user allowed route with optional auth
router.post('/',
  optionalAuth,
  createBookingValidator, validate,
  bookingController.createBooking
);

// Protected routes requiring authentication
router.use(protect);

router.get('/',               bookingController.getBookings);
router.get('/provider/stats', authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), bookingController.getProviderStats);
router.get('/:id',            bookingController.getBooking);

router.patch('/:id/status',
  authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'),
  updateStatusValidator, validate,
  bookingController.updateStatus
);

router.patch('/:id/assign-technician',
  authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'),
  bookingController.assignTechnician
);

router.delete('/:id/cancel',
  authorize('CUSTOMER'),
  bookingController.cancelBooking
);

export default router;
