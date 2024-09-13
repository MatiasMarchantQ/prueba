import express from 'express';
const router = express.Router();
import { getUser, register, getAllUsers, updateUser } from '../controllers/userController.js';
import { authenticate, isAdmin, isEjecutivo, isConsultor, isDespachador, isValidador } from '../middlewares/authMiddleware.js';

router.post('/register', authenticate, isAdmin, register);
router.get('/', authenticate, isAdmin, getAllUsers);
router.put('/:id', authenticate, updateUser);

export default router;