import { Router } from 'express';
import multer from 'multer';
import * as uploadController from './upload.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

router.use(protect);

router.get('/gallery', uploadController.getMediaGallery);
router.post('/single', upload.single('image'), uploadController.uploadSingleImage);
router.post('/multiple', upload.array('images', 100), uploadController.uploadMultipleImages);

export default router;
