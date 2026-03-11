import { body, param } from 'express-validator';

export const createSiteValidator = [
  body('site_name').notEmpty().withMessage('Site name required'),

  body('site_admin.full_name')
    .notEmpty()
    .withMessage('Site admin name required'),

  body('site_admin.email')
    .isEmail()
    .withMessage('Valid site admin email required'),

  body('site_admin.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('site_admin.aadhaar_pan')
    .notEmpty(),

  body('site_admin.birthdate')
    .notEmpty(),

  body('site_admin.gender')
    .notEmpty(),
  body('viewers').optional().isArray(),

  body('viewers.*.email')
    .optional()
    .isEmail()
    .withMessage("Viewer email must be valid"),

];

export const siteIdValidator = [
  param('id').isUUID().withMessage('Invalid site id')
];