import express from 'express';
const router = express.Router();
import salesController from '../controllers/SalesController.js';

router.post('/sales', salesController.createSale);
router.get('/sales', salesController.getSales);
router.get('/sales/:id', salesController.getSaleById);
router.put('/sales/:id', salesController.updateSale);
router.delete('/sales/:id', salesController.deleteSale);

export default router;