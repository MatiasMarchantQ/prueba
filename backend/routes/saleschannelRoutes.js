import express from 'express';
import { getSalesChannels , getAllSalesChannels, createSalesChannel , updateSalesChannel , toggleSalesChannelStatus } from '../controllers/saleschannelController.js';
import { authenticate} from '../middlewares/authMiddleware.js';
import recaptchaMiddleware from '../middlewares/recaptchaMiddleware.js';


const router = express.Router();

//get
router.get('/', authenticate, getSalesChannels);
router.get('/all', authenticate, getAllSalesChannels);
router.post('/create', authenticate, recaptchaMiddleware,  createSalesChannel);
router.put('/:salesChannelId', authenticate, recaptchaMiddleware, updateSalesChannel);
router.put('/:salesChannelId/toggle-status', authenticate, toggleSalesChannelStatus);

export default router;