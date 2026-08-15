import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('phone')
    .optional()
    .isMobilePhone('any').withMessage('Invalid phone number'),

  body('role')
    .optional()
    .isIn(['CUSTOMER', 'PROVIDER', 'SELLER'])
    .withMessage('Invalid role'),
];

export const loginValidator = [
  body('email')
    .optional()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .optional(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/\d/).withMessage('New password must contain at least one number'),
];
