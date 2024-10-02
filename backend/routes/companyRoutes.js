// routes/companyRoutes.js
import express from 'express';
import { getCompanies, swapPriorityLevels, createCompany, updateCompanyName, toggleCompanyStatus } from '../controllers/companyController.js';
import { authenticate} from '../middlewares/authMiddleware.js';


const router = express.Router();

//Obtener lista empresas
router.get('/', authenticate ,getCompanies);

//Crear una nueva empresa
router.post('/', authenticate , createCompany);

//Actualizar nombre de una empresa
router.put('/:companyId', authenticate, updateCompanyName);

//Habilitar y deshabilitar empresas
router.patch('/:companyId/toggle-status', toggleCompanyStatus);

//Intercambiar niveles de prioridad entre 2 empresas
router.post('/swap-priority-levels', swapPriorityLevels);

export default router;
