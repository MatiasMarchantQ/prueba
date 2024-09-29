// routes/companyRoutes.js
import express from 'express';
import { getCompanies } from '../controllers/companyController.js';
import { authenticate} from '../middlewares/authMiddleware.js';


const router = express.Router();

router.get('/', authenticate ,getCompanies);

export default router;
