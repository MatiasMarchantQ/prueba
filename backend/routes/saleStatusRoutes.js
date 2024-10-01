// routes/roleRoutes.js
import express from 'express';
import { getSaleStatuses , getReasons , getSaleStatusesFilters } from '../controllers/saleStatusController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), getSaleStatuses);
router.get('/filters', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), getSaleStatusesFilters );
router.get('/reasons/:saleStatusId', authenticate, getReasons);


export default router;