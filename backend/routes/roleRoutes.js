// routes/roleRoutes.js
import express from 'express';
import { getRoles } from '../controllers/roleController.js';

const router = express.Router();

router.get('/roles', getRoles);

export default router;
