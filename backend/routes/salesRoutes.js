import express from 'express';
const router = express.Router();
import { createSale, getSales, getSaleById, updateSale, deleteSale } from '../controllers/salesController.js';
import { authenticate, isSuperAdmin, isExecutive } from '../middlewares/authMiddleware.js';

router.post('/sales',authenticate, isExecutive, isSuperAdmin, createSale);
router.get('/sales',authenticate, isSuperAdmin, getSales);
router.get('/sales/:id', getSaleById);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);

export default router;