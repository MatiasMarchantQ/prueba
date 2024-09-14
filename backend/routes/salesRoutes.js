import express from 'express';
const router = express.Router();
import { createSale, getSales, getSaleById, updateSale, deleteSale } from '../controllers/SalesController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

// Usa el middleware isAnyRole con los roles permitidos
router.post('/sales', authenticate, isAnyRole(['Ejecutivo', 'Administrador', 'SuperAdmin']), createSale);
router.get('/sales', authenticate, isAnyRole(['SuperAdmin']), getSales);
router.get('/sales/:id', getSaleById);
router.put('/sales/:id', authenticate, isAnyRole(['SuperAdmin']), updateSale);
router.delete('/sales/:id', authenticate, isAnyRole(['SuperAdmin']), deleteSale);

export default router;
