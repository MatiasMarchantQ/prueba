import express from 'express';
const router = express.Router();
import upload from '../config/multerConfig.js';
import { createSale, getSales, getExecutiveSales, updateSale, updateSaleByExecutive } from '../controllers/salesController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

//get
router.get('/all', authenticate, isAnyRole(['SuperAdmin']), getSales);
router.get('/executive', authenticate, isAnyRole(['Ejecutivo']), getExecutiveSales);

//put
router.put('/update/:sale_id', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Validador']), updateSale);
router.put('/update/executive/:sale_id',authenticate, isAnyRole(['Ejecutivo','SuperAdmin', 'Administrador']), updateSaleByExecutive);

//post
router.post('/create', authenticate, isAnyRole(['Ejecutivo']), upload.array('id_card_image', 3), createSale);

export default router;
