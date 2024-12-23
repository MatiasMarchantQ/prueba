// routes/roleRoutes.js
import express from 'express';
import { getSaleStatuses , addOrUpdateReason, getReasons , getReasonsByStatus, getSaleStatusesFilters, getAllReasons, createReason , updateReason, toggleReason} from '../controllers/saleStatusController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';
import recaptchaMiddleware from '../middlewares/recaptchaMiddleware.js';
const router = express.Router();

router.get('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador', 'Consultor']), getSaleStatuses);
router.get('/filters', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador', 'Consultor']), getSaleStatusesFilters );

//Motivos
router.get('/reasons/:saleStatusId', authenticate, getReasons);
router.get('/:saleStatusId/all', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador', 'Consultor']), getAllReasons);
router.post('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), recaptchaMiddleware, createReason);
router.put('/:reasonId', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), recaptchaMiddleware, updateReason);
router.patch('/:reasonId', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Ejecutivo', 'Validador','Despachador']), toggleReason);

router.get('/reasons', getReasonsByStatus);
router.post('/reasons', authenticate, isAnyRole(['SuperAdmin', 'Consultor']), recaptchaMiddleware, addOrUpdateReason);



export default router;