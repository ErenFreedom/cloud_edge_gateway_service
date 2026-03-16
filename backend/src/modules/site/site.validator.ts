import { body, param } from 'express-validator';

/* ---------------- CREATE SITE ---------------- */

export const createSiteValidator = [

  body('site_name')
    .notEmpty()
    .withMessage('Site name required'),

  body('site_admin.full_name')
    .notEmpty()
    .withMessage('Site admin name required'),

  body('site_admin.email')
    .isEmail()
    .withMessage('Valid site admin email required'),

  body('site_admin.phone')
    .optional()
    .isString()
    .withMessage('Phone must be string'),

  body('site_admin.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('site_admin.aadhaar_pan')
    .notEmpty()
    .withMessage('Aadhaar/PAN required'),

  body('site_admin.birthdate')
    .notEmpty()
    .withMessage('Birthdate required'),

  body('site_admin.gender')
    .notEmpty()
    .withMessage('Gender required'),

  body('viewers')
    .optional()
    .isArray(),

  body('viewers.*.email')
    .optional()
    .isEmail()
    .withMessage("Viewer email must be valid"),

  body('viewers.*.phone')
    .optional()
    .isString()
    .withMessage("Viewer phone must be string"),

];


/* ---------------- SITE ID ---------------- */

export const siteIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid site id')
];


/* ---------------- EDIT SITE ---------------- */

export const editSiteValidator = [

  param("siteId")
    .isUUID()
    .withMessage("Invalid site id"),

  body("site_name")
    .optional()
    .isString(),

  body("phone")
    .optional()
    .isString(),

  body("address_line1")
    .optional()
    .isString(),

  body("address_line2")
    .optional()
    .isString(),

  body("state")
    .optional()
    .isString(),

  body("country")
    .optional()
    .isString(),

  body("gst_number")
    .optional()
    .isString(),

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


/* ---------------- EDIT USER ---------------- */

export const editSiteUserValidator = [

  body("user_id")
    .isUUID()
    .withMessage("Invalid user id"),

  body("full_name")
    .optional()
    .isString(),

  body("phone")
    .optional()
    .isString(),

  body("birthdate")
    .optional()
    .isISO8601(),

  body("gender")
    .optional()
    .isString(),

  body("aadhaar_pan")
    .optional()
    .isString()
    .withMessage("Aadhaar/PAN must be string"),

  body("new_password")
    .optional()
    .isString(),

  body("old_password")
    .optional()
    .isString(),

  body("new_email")
    .optional()
    .isEmail(),

  body("current_password")
    .optional()
    .isString()

];


export const requestEmailChangeValidator = [

  body("user_id")
    .isUUID()
    .withMessage("Invalid user id"),

  body("old_email")
    .isEmail()
    .withMessage("Old email must be valid"),

  body("new_email")
    .isEmail()
    .withMessage("New email must be valid")

]

export const verifyEmailChangeValidator = [

  body("otp_id")
    .isUUID()
    .withMessage("Invalid otp id"),

  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("Invalid OTP")

]