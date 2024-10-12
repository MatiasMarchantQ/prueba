import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadPath = 'uploads/';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: () => uploadPath,
    filename: (req, file) => `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`,
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword'];
    cb(null, allowedMimeTypes.some(type => file.mimetype.startsWith(type)));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([{ name: 'other_images', maxCount: 5 }]);

export default upload;