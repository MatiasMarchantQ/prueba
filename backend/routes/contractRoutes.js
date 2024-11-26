// routes/contractRoutes.js
import express from 'express';
import { getAllContracts } from '../controllers/contractController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getAllContracts);

export default router;