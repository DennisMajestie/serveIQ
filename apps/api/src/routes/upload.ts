import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure upload directory exists before each upload
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    console.log(`[Upload] Processing: ${file.originalname} -> ${fileName}`);
    cb(null, fileName);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', (req: Request, res: Response, next: express.NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[Upload] Multer error:', err);
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }

    try {
      if (!req.file) {
        console.error('[Upload] No file provided in request');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = `/api/v1/upload/uploads/${req.file.filename}`;
      console.log(`[Upload] Success: ${fileUrl}`);
      return res.json({ url: fileUrl });
    } catch (error) {
      console.error('[Upload] Error processing request:', error);
      return res.status(500).json({ message: 'Upload failed' });
    }
  });
});

router.use('/uploads', express.static(uploadDir));

export default router;