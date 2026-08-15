/**
 * routes/registrations.js
 * POST /api/registrations — Create new registration
 * GET  /api/registrations/:ref — Get registration by reference
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const { query } = require('../config/db');
const { createRegistrant } = require('../services/registrationService');
const emailService = require('../services/emailService');

const router = express.Router();

// Rate limit: max 5 registrations per IP per hour
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many registration attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Validation Rules ─────────────────────────────────────────────────────────

const DESIGNATIONS = [
  'Archbishop','Bishop','Dr','His Eminence','Most Revd Dr','Most Revd Prof',
  'Mr','Mrs','Ms','Presiding Prelate','Revd','Revd Dr','Rt Revd','Very Revd',
];

const OFFICES = [
  'Administrative Assistant','Admin Bishop','AMC Executive Member','Bishop','Conference Secretary',
  'General Secretary','Prelate','Presiding Bishop','Secretary of Conference','Other',
];

const registrationValidation = [
  body('designation').isIn(DESIGNATIONS).withMessage('Invalid designation'),
  body('first_name').trim().notEmpty().isLength({ max: 100 }).withMessage('First name is required'),
  body('last_name').trim().notEmpty().isLength({ max: 100 }).withMessage('Last name is required'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('office').isIn(OFFICES).withMessage('Invalid office'),
  body('category').isIn(['Delegate','Invited Guest','Observer']).withMessage('Invalid category'),
  body('church').optional().trim().isLength({ max: 255 }),
  body('country').trim().notEmpty().isLength({ max: 100 }).withMessage('Country is required'),
  body('accommodation').optional().isBoolean(),
  body('accommodation_nights').optional().isInt({ min: 0, max: 30 }),
  body('hotel_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('hotel_rooms').optional().isInt({ min: 1, max: 10 }),
  body('num_people').optional().isInt({ min: 1, max: 50 }),
  body('delegate_details').optional().isArray().withMessage('Delegate details must be an array').bail().custom((value, { req }) => {
    const expected = Math.max(0, Number(req.body.num_people || 1) - 1);
    if (expected === 0) return true;
    if (!Array.isArray(value) || value.length !== expected) {
      throw new Error(`Delegate details must include ${expected} additional delegate${expected === 1 ? '' : 's'}`);
    }
    return true;
  }),
  body('delegate_details.*.designation')
    .if(body('delegate_details').exists())
    .trim()
    .notEmpty().withMessage('Delegate designation is required'),
  body('delegate_details.*.category')
    .if(body('delegate_details').exists())
    .trim().isIn(['Delegate','Invited Guest','Observer']).withMessage('Invalid delegate category'),
  body('delegate_details.*.first_name')
    .if(body('delegate_details').exists())
    .trim()
    .notEmpty().withMessage('Delegate first name is required')
    .isLength({ max: 100 }).withMessage('Delegate first name must be 100 characters or fewer'),
  body('delegate_details.*.last_name')
    .if(body('delegate_details').exists())
    .trim()
    .notEmpty().withMessage('Delegate last name is required')
    .isLength({ max: 100 }).withMessage('Delegate last name must be 100 characters or fewer'),
  body('delegate_details.*.email')
    .if(body('delegate_details').exists())
    .trim().isEmail().withMessage('Valid delegate email is required'),
  body('delegate_details.*.phone')
    .if(body('delegate_details').exists())
    .optional().trim().isLength({ max: 30 }).withMessage('Delegate phone must be 30 characters or fewer'),
  body('delegate_details.*.country')
    .if(body('delegate_details').exists())
    .trim().notEmpty().withMessage('Delegate country is required')
    .isLength({ max: 100 }).withMessage('Delegate country must be 100 characters or fewer'),
  body('delegate_details.*.office')
    .if(body('delegate_details').exists())
    .trim().notEmpty().withMessage('Delegate office is required'),
  body('delegate_details.*.church')
    .if(body('delegate_details').exists())
    .optional().trim().isLength({ max: 255 }).withMessage('Delegate church must be 255 characters or fewer'),
  body('dietary_requirements').optional().trim().isLength({ max: 1000 }),
  body('special_requests').optional().trim().isLength({ max: 1000 }),
];

// ─── POST /api/registrations ──────────────────────────────────────────────────

router.post('/', registrationLimiter, registrationValidation, async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // Check if registration is open
    const [settingRows] = await query(
      `SELECT setting_value FROM conference_settings WHERE setting_key = 'registration_open'`
    );
    if (settingRows.length && settingRows[0].setting_value !== 'true') {
      return res.status(403).json({ error: 'Registration is currently closed.' });
    }

    // Check max registration cap
    const [capRows] = await query(
      `SELECT setting_value FROM conference_settings WHERE setting_key = 'max_registrations'`
    );
    const [countRows] = await query('SELECT COUNT(*) AS count FROM registrants');
    const maxReg = parseInt(capRows[0]?.setting_value || '500', 10);
    if (Number(countRows[0].count) >= maxReg) {
      return res.status(409).json({ error: 'Registration is now closed. Maximum capacity has been reached.' });
    }

    // Create registrant record
    const registrant = await createRegistrant(req.body);

    // Fire notification emails (non-blocking — don't fail if email errors)
    Promise.all([
      emailService.sendRegistrationConfirmation(registrant),
      emailService.sendAdminNewRegistrationNotification(registrant),
    ]).catch((err) => console.error('[Email Error]', err.message));

    return res.status(201).json({
      success: true,
      registrationRef: registrant.registration_ref,
      registrantId: registrant.id,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/registrations/:ref ─────────────────────────────────────────────

router.get('/:ref', async (req, res, next) => {
  try {
    const ref = req.params.ref.toUpperCase().trim();

    const [rows] = await query(
      `SELECT *
       FROM registrants WHERE registration_ref = ?`,
      [ref]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    return res.json({ registration: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
