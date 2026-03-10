import { body, param } from 'express-validator';

export const createSiteValidator = [
  body('site_name').notEmpty().withMessage('Site name required'),
  body('phone').optional().isString(),

  body('address_line1').optional().isString(),
  body('state').optional().isString(),
  body('country').optional().isString(),

  body('siteAdminEmail')
    .isEmail()
    .withMessage('Valid site admin email required'),

  body('siteViewerEmail')
    .optional()
    .isEmail()
];

export const siteIdValidator = [
  param('id').isUUID().withMessage('Invalid site id')
];