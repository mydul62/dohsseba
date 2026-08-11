import { body, param } from 'express-validator';

export const createBookingValidator = [
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('addressId').optional().trim(),
  body('addressText').optional().trim(),
  body('scheduledAt')
    .notEmpty().withMessage('Scheduled date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

export const updateStatusValidator = [
  param('id').notEmpty().withMessage('Booking ID is required'),
  body('status')
    .isIn([
      'PENDING',
      'CONFIRMED',
      'TECHNICIAN_ASSIGNED',
      'TECHNICIAN_ON_THE_WAY',
      'IN_PROGRESS',
      'WORK_COMPLETED',
      'CUSTOMER_CONFIRMED',
      'COMPLETED',
      'CANCELLED',
      'REJECTED',
    ])
    .withMessage('Invalid booking status'),
];
