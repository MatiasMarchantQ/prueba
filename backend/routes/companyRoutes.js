// routes/companyRoutes.js
import express from 'express';
import { getCompanies, getAllCompanies, swapPriorityLevels, createCompany, updateCompanyName, toggleCompanyStatus } from '../controllers/companyController.js';
import { authenticate} from '../middlewares/authMiddleware.js';


const router = express.Router();

//Obtener lista empresas
router.get('/', authenticate ,getCompanies);

//Obtener lista empresas
router.get('/all', authenticate, getAllCompanies);

//Crear una nueva empresa
router.post('/create', authenticate , createCompany);

//Actualizar nombre de una empresa
router.put('/:companyId', authenticate, updateCompanyName);

//Habilitar y deshabilitar empresas
router.patch('/:companyId/toggle-status', authenticate, toggleCompanyStatus);

//Intercambiar niveles de prioridad entre 2 empresas
router.post('/swap-priority-levels', authenticate, swapPriorityLevels);

export default router;
