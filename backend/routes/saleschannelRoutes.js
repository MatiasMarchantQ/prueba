import express from 'express';
import { getSalesChannels } from '../controllers/saleschannelController.js';

const router = express.Router();

//get
router.get('/', getSalesChannels);

export default router;