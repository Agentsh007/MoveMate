// =============================================
// Multer Upload Middleware — File Upload Handling
// =============================================
// WHY Multer?
// Express doesn't handle file uploads natively.
// Multer parses multipart/form-data (the encoding used for file uploads)
// and saves files temporarily to disk or memory.
//
// We use memoryStorage (files stay in RAM as Buffer) because:
// - We're uploading immediately to Supabase Storage
// - We don't need to persist files locally
// - Simpler cleanup (no temp files on disk)
//
// Limits protect against abuse:
// - 5MB max file size
// - Only image MIME types allowed
// - Max 10 files per upload
// =============================================

import multer from 'multer';

// Store files in memory (Buffer) — no temp files on disk
const storage = multer.memoryStorage();

// Filter: only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accept the file
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max per file
    files: 10,                   // Max 10 files per request
  },
});

export default upload;
