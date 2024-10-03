import express from 'express';
import { getSalesChannels , getAllSalesChannels, createSalesChannel , updateSalesChannel , toggleSalesChannelStatus } from '../controllers/saleschannelController.js';
import { authenticate} from '../middlewares/authMiddleware.js';

const router = express.Router();

//get
router.get('/', authenticate, getSalesChannels);
router.get('/all', authenticate, getAllSalesChannels);
router.post('/create', authenticate,  createSalesChannel);
router.put('/:salesChannelId', authenticate,  updateSalesChannel);
router.put('/:salesChannelId/toggle-status', authenticate, toggleSalesChannelStatus);

export default router;