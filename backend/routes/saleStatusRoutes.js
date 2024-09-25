// routes/roleRoutes.js
import express from 'express';
import { getSaleStatuses, getReasons  } from '../controllers/saleStatusController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), getSaleStatuses);
router.get('/reasons/:saleStatusId', getReasons);


export default router;