/**
 * services/paynowService.js
 * Wrapper around the official Paynow NodeJS SDK.
 * Docs: https://github.com/paynow/Paynow-NodeJS-SDK
 * 
 * IMPORTANT: Test Mode Phone Numbers
 * When using Paynow in TEST MODE (Integration ID 25178), EcoCash transactions require:
 * - Test case phone numbers like: 0777000000, 0781234567, etc.
 * - Real phone numbers will be rejected with error about test case numbers
 */

const { Paynow } = require('paynow');

// Initialise with integration credentials from env
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID || 'stub-id',
  process.env.PAYNOW_INTEGRATION_KEY || 'stub-key'
);

function normalizeBaseUrl(value, fallback) {
  if (!value) return fallback;
  return String(value).trim().replace(/\/$/, '');
}

function resolvePaynowUrls({ clientUrl, serverUrl } = {}) {
  const resolvedClientUrl = normalizeBaseUrl(
    clientUrl || process.env.CLIENT_URL || process.env.VITE_APP_URL || 'http://localhost:5173',
    'http://localhost:5173'
  );
  const resolvedServerUrl = normalizeBaseUrl(
    serverUrl || process.env.SERVER_URL || process.env.PAYNOW_RESULT_URL || 'http://localhost:5000',
    'http://localhost:5000'
  );

  return {
    resultUrl: `${resolvedServerUrl}/api/payments/paynow-result`,
    returnUrl: `${resolvedClientUrl}/payment-status`,
  };
}

function withTimeout(promise, ms = 15000, message = 'Paynow gateway request timed out') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Check if we're in test mode based on integration ID
 * @returns {boolean}
 */
function isTestMode() {
  const id = process.env.PAYNOW_INTEGRATION_ID;
  // ID 25178 is Paynow's test integration ID
  return id === '25178' || id === 'test' || process.env.NODE_ENV === 'test';
}

/**
 * Validate phone number for test mode
 * In test mode, EcoCash/Telecash need valid test numbers
 * @param {string} phone - Phone number to validate
 * @param {string} method - Payment method (ecocash, telecash, etc.)
 * @returns {object} { valid: boolean, message: string }
 */
function validatePhoneForTestMode(phone, method) {
  if (!isTestMode()) {
    // No validation needed in production
    return { valid: true, message: '' };
  }

  if (!['ecocash', 'telecash'].includes(method)) {
    return { valid: true, message: '' };
  }

  // In test mode, phone should be a valid format
  // Paynow test mode accepts: 077XXXXXXXX, 078XXXXXXXX, 071XXXXXXXX, etc.
  const phoneRegex = /^0[0-9]{9}$/; // Zimbabwe format
  if (!phoneRegex.test(phone)) {
    return {
      valid: false,
      message: `Test mode: EcoCash/Telecash requires valid Zimbabwe phone number format (0XXXXXXXXX). Got: ${phone}`
    };
  }

  return { valid: true, message: '' };
}

/**
 * Initiate a Paynow payment.
 *
 * @param {object} options
 * @param {object} options.registrant   — Registrant DB row
 * @param {number} options.amount       — Total amount in USD (or ZWL)
 * @param {string} options.currency     — 'USD' | 'ZWL'
 * @param {string} options.paymentMethod — 'ecocash'|'telecash'|'visa'|'mastercard'|'paynow'
 * @param {string} [options.phone]      — Mobile number for EcoCash/Telecash
 * @param {number} [options.paymentId]  — Payment ID from database (for redirect URL)
 * @param {string} [options.reference]  — Paynow reference (for tracking)
 * @returns {Promise<{ success, redirectUrl, pollUrl, paynowReference }>}
 */
async function initiatePayment({ registrant, amount, currency, paymentMethod, phone, paymentId, reference, clientUrl, serverUrl }) {
  // Use the reference passed in or construct one
  const paynowReference = reference || `${registrant.registration_ref}-${Date.now()}`;

  // In test mode, Paynow requires the merchant email, not the registrant email
  // The merchant email is the one registered with Paynow
  const merchantEmail = process.env.PAYNOW_MERCHANT_EMAIL || process.env.RESEND_FROM_EMAIL || 'conference@africamethodistcouncil.org';

  console.log('[Paynow] Test Mode:', isTestMode());
  console.log('[Paynow] Using merchant email:', merchantEmail);

  // For mobile money methods in test mode, validate phone number
  if (['ecocash', 'telecash'].includes(paymentMethod)) {
    const validation = validatePhoneForTestMode(phone, paymentMethod);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    console.log(`[Paynow] ${paymentMethod.toUpperCase()} Phone: ${phone}`);
  }

  // Create a Paynow payment object with merchant email (required in test mode)
  const payment = paynow.createPayment(paynowReference, merchantEmail);

  // Add the single line item
  payment.add(
    `AMC 2027 Conference Registration – ${registrant.category}`,
    amount
  );

  const { resultUrl, returnUrl } = resolvePaynowUrls({ clientUrl, serverUrl });
  paynow.resultUrl = resultUrl;
  paynow.returnUrl = paymentId
    ? `${returnUrl}?paymentId=${paymentId}&ref=${registrant.registration_ref}&method=${paymentMethod}`
    : returnUrl;

  let response;

  try {
    if (paymentMethod === 'ecocash') {
      // Mobile money — EcoCash
      console.log('[Paynow] Initiating EcoCash transaction...');
      response = await withTimeout(paynow.sendMobile(payment, phone, 'ecocash'), 15000, 'Paynow EcoCash request timed out');
    } else if (paymentMethod === 'telecash') {
      // Mobile money — Telecash
      console.log('[Paynow] Initiating Telecash transaction...');
      response = await withTimeout(paynow.sendMobile(payment, phone, 'telecash'), 15000, 'Paynow Telecash request timed out');
    } else {
      // Web/card payment — redirects to Paynow hosted page
      console.log('[Paynow] Initiating web/card transaction...');
      response = await withTimeout(paynow.send(payment), 15000, 'Paynow card request timed out');
    }
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Paynow gateway connection failed';
    console.error('[Paynow Error]', message);
    throw new Error(`Paynow gateway request failed: ${message}`);
  }

  if (!response || typeof response !== 'object') {
    throw new Error('Paynow gateway returned an empty response.');
  }

  if (!response.success) {
    const errorMsg = response.error || 'Paynow payment initiation failed';
    console.error('[Paynow Error]', errorMsg);
    throw new Error(errorMsg);
  }

  console.log('[Paynow] Payment initiated successfully');
  return {
    success: true,
    redirectUrl: response.redirectUrl || null,
    pollUrl: response.pollUrl || null,
    paynowReference,
  };
}

/**
 * Poll Paynow for the current payment status.
 *
 * @param {string} pollUrl — Poll URL returned during initiation
 * @returns {Promise<object>} Paynow status response object
 */
async function pollStatus(pollUrl) {
  const status = await paynow.pollTransaction(pollUrl);
  return status;
}

/**
 * Verify the hash in a Paynow webhook POST body.
 * Paynow sends a SHA512 hash of all fields + the integration key.
 *
 * @param {object} params — Raw POST body from Paynow
 * @returns {boolean}
 */
function verifyHash(params) {
  const crypto = require('crypto');
  const { hash, ...rest } = params;

  // Build the string to hash: concatenate all field values (excluding 'hash') in order + integration key
  const values = Object.values(rest).join('') + process.env.PAYNOW_INTEGRATION_KEY;
  const expected = crypto.createHash('sha512').update(values).digest('hex').toUpperCase();

  return expected === (hash || '').toUpperCase();
}

module.exports = { initiatePayment, pollStatus, verifyHash };
