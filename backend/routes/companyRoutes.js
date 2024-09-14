// routes/companyRoutes.js
import express from 'express';
import { getCompanies } from '../controllers/companyController.js';

const router = express.Router();

router.get('/companies', getCompanies);

export default router;
