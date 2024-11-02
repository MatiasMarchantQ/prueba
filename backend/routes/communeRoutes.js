
import express from 'express';
import { getCommunesByRegion, getAllCommunesByRegion , addCommuneToRegion, updateCommune , toggleCommuneStatus  } from '../controllers/communeController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import recaptchaMiddleware from '../middlewares/recaptchaMiddleware.js';
const router = express.Router();

router.get('/communes/:regionId', authenticate, getCommunesByRegion);
router.get('/region/:regionId', authenticate, getAllCommunesByRegion);
router.post('/regions/:regionId/communes', authenticate, recaptchaMiddleware, addCommuneToRegion);
router.put('/:communeId', authenticate, recaptchaMiddleware, updateCommune);
router.patch('/:communeId/toggle-status', authenticate ,toggleCommuneStatus);



export default router;
