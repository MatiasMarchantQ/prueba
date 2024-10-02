import express from 'express';
import { getSalesChannels , createSalesChannel , updateSalesChannel , toggleSalesChannelStatus } from '../controllers/saleschannelController.js';
import { authenticate} from '../middlewares/authMiddleware.js';

const router = express.Router();

//get
router.get('/', authenticate, getSalesChannels);
router.post('/', authenticate,  createSalesChannel);
router.put('/:salesChannelId', authenticate,  updateSalesChannel);
router.put('/:salesChannelId/toggle-status', authenticate, toggleSalesChannelStatus);

export default router;