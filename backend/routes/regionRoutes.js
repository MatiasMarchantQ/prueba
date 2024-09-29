// routes/regionRoutes.js
import express from 'express';
import { getRegions } from '../controllers/regionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.get('/', authenticate ,getRegions);

export default router;
