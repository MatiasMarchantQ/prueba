// routes/roleRoutes.js
import express from 'express';
import { getSaleStatuses } from '../controllers/saleStatusController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), getSaleStatuses);

export default router;