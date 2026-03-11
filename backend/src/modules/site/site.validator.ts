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


export const editSiteValidator = [

  param("siteId")
    .isUUID()
    .withMessage("Invalid site id"),

  body("site_name").optional().isString(),

  body("phone").optional().isString(),

  body("address_line1").optional().isString(),
  body("address_line2").optional().isString(),

  body("state").optional().isString(),
  body("country").optional().isString(),

  body("gst_number").optional().isString(),

  body("new_admin_email")
    .optional()
    .isEmail(),

  body("add_viewers")
    .optional()
    .isArray(),

  body("remove_viewers")
    .optional()
    .isArray()

];


export const editSiteUserValidator = [

  body("user_id")
    .isUUID()
    .withMessage("Invalid user id"),

  body("full_name").optional().isString(),
  body("phone").optional().isString(),

  body("birthdate").optional().isISO8601(),
  body("gender").optional().isString(),

  body("aadhaar_pan").optional().isString(),

  body("new_password").optional().isString(),
  body("old_password").optional().isString(),

  body("new_email").optional().isEmail(),

  body("current_password").optional().isString()

]