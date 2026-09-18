/**
 * middleware/proofUpload.js
 * Multer configuration for proof-of-payment files.
 *
 * Shared by the delegate-facing upload (POST /api/payments/proof) and the
 * admin-facing one (POST /api/uploads/payment-proof) so both accept exactly
 * the same file types and size, and both land in the same directory.
 *
 * Files are written to <server>/uploads/proofs and served statically at
 * /uploads/proofs/<filename> (see app.js). Names carry 12 random bytes, so a
 * URL cannot be guessed from a registration reference.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const PROOF_DIR = path.resolve(__dirname, '..', 'uploads', 'proofs');
fs.mkdirSync(PROOF_DIR, { recursive: true });

const ALLOWED_PROOF_MIME = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — a phone photo of a bank slip

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PROOF_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED_PROOF_MIME[file.mimetype] || path.extname(file.originalname) || '.bin';
      cb(null, `pop-${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_PROOF_MIME[file.mimetype]) {
      return cb(new Error('Proof of payment must be a PDF or an image (JPG, PNG, WEBP, HEIC).'));
    }
    cb(null, true);
  },
});

/**
 * Run the single-file upload and hand back a plain error message instead of
 * multer's own error shape, which the routes turn into a 400.
 */
function receiveProof(req, res, next) {
  upload.single('proof')(req, res, (err) => {
    if (err) {
      req.proofError =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Maximum size is 10 MB.'
          : err.message || 'Upload failed.';
    }
    next();
  });
}

/** Public URL for a stored proof file, as written to payments.proof_url. */
const proofUrl = (filename) => `/uploads/proofs/${filename}`;

module.exports = { receiveProof, proofUrl, PROOF_DIR, MAX_BYTES, ALLOWED_PROOF_MIME };
