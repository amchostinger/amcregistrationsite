/**
 * routes/uploads.js
 * POST /api/uploads/speaker-photo — admin-only image upload (multipart/form-data)
 *
 * Files are written to <server>/uploads/speakers and served statically at
 * /uploads/speakers/<filename> (see app.js).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/clerkAuth');

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'speakers');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'));
    }
    cb(null, true);
  },
});

router.post('/speaker-photo', requireAuth, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Maximum size is 5 MB.'
          : err.message || 'Upload failed.';
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file received.' });

    // Relative URL — the client resolves it against the API origin.
    res.status(201).json({ url: `/uploads/speakers/${req.file.filename}` });
  });
});

// ─── Conference resource documents ────────────────────────────────────────────

const RESOURCE_DIR = path.resolve(__dirname, '..', 'uploads', 'resources');
fs.mkdirSync(RESOURCE_DIR, { recursive: true });

const ALLOWED_DOC_MIME = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'application/zip': '.zip',
  ...ALLOWED_MIME,
};

const resourceUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, RESOURCE_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED_DOC_MIME[file.mimetype] || path.extname(file.originalname) || '.bin';
      // Keep a readable slug of the original name so downloads are recognisable.
      const slug = path
        .basename(file.originalname, path.extname(file.originalname))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'resource';
      cb(null, `${slug}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_DOC_MIME[file.mimetype]) {
      return cb(new Error('Allowed file types: PDF, Word, PowerPoint, Excel, TXT, ZIP or an image.'));
    }
    cb(null, true);
  },
});

router.post('/resource-file', requireAuth, (req, res) => {
  resourceUpload.single('file')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Maximum size is 25 MB.'
          : err.message || 'Upload failed.';
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file received.' });

    res.status(201).json({
      url: `/uploads/resources/${req.file.filename}`,
      size: req.file.size,
      name: req.file.originalname,
    });
  });
});

module.exports = router;
