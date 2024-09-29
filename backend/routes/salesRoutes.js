import express from 'express';
const router = express.Router();
import upload from '../config/multerConfig.js';
import { exportSales } from '../controllers/exportController.js';
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

// Ruta para exportar ventas
router.get('/export', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Validador', 'Ejecutivo', 'Despachador']), (req, res) => {
    const format = req.query.format; // Obtener el formato de la consulta
    exportSales(req, res, format);
  });

export default router;
