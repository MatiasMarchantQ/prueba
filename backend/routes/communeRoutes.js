// routes/communeRoutes.js
import express from 'express';
import { getCommunesByRegion  } from '../controllers/communeController.js';

const router = express.Router();

router.get('/communes/:regionId', getCommunesByRegion);

export default router;
