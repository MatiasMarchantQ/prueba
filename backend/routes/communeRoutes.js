// routes/communeRoutes.js
import express from 'express';
import { getCommunesByRegion, addCommuneToRegion, updateCommune   } from '../controllers/communeController.js';
const router = express.Router();

router.get('/communes/:regionId', getCommunesByRegion);
router.post('/regions/:regionId/communes', addCommuneToRegion);
router.put('/:communeId', updateCommune);

export default router;
