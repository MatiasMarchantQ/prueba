import express from 'express';
const router = express.Router();
import upload from '../config/multerConfig.js';
import { createSale, getSales, getSaleById, getSalesBySearch, updateSale, getPromotionsByCommune, getInstallationAmountsByPromotion } from '../controllers/salesController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

//get
router.get('/all', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Validador', 'Ejecutivo','Despachador']), getSales);
// get promotions by commune
router.get('/promotions/commune/:commune_id', getPromotionsByCommune);
// get installation amounts by promotion
router.get('/installation-amounts/promotion/:promotion_id', getInstallationAmountsByPromotion);
// get por buscador de text
router.get('/all/search', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Validador', 'Ejecutivo','Despachador']), getSalesBySearch);
// get por id
router.get('/:sale_id', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Validador', 'Ejecutivo','Despachador']), getSaleById);

//patch
router.put('/update/:sale_id', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador', 'Despachador']), upload, updateSale);

//post
router.post('/create', authenticate, isAnyRole(['Ejecutivo','SuperAdmin','Administrador']), upload, createSale);

export default router;
