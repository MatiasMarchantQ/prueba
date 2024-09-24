import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}_${file.originalname}`;
    cb(null, fileName);
  }
});

// Configuración de multer
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Limitar a 2MB por archivo
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image in JPG or PNG format'));
    }
    cb(undefined, true);
  }
});

export default upload;
