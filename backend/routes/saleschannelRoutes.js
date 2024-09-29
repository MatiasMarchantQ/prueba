import express from 'express';
import { getSalesChannels } from '../controllers/saleschannelController.js';
import { authenticate} from '../middlewares/authMiddleware.js';

const router = express.Router();

//get
router.get('/', authenticate, getSalesChannels);

export default router;