// routes/communeRoutes.js
import express from 'express';
import { getCommunesByRegion, getAllCommunesByRegion , addCommuneToRegion, updateCommune , toggleCommuneStatus  } from '../controllers/communeController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/communes/:regionId', authenticate, getCommunesByRegion);
router.get('/region/:regionId', authenticate, getAllCommunesByRegion);
router.post('/regions/:regionId/communes', authenticate, addCommuneToRegion);
router.put('/:communeId', authenticate, updateCommune);
router.patch('/:communeId/toggle-status', toggleCommuneStatus);


export default router;
