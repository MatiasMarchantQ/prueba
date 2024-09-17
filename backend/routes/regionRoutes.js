// routes/regionRoutes.js
import express from 'express';
import { getRegions } from '../controllers/regionController.js';

const router = express.Router();

router.get('/', getRegions);

export default router;
