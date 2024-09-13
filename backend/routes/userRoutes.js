import express from 'express';
const router = express.Router();
import { getAllUsers, register, updateUser } from '../controllers/userController.js';
import { authenticate, isSuperAdmin } from '../middlewares/authMiddleware.js';

router.post('/register', authenticate, isSuperAdmin, register);
router.get('/', authenticate, isSuperAdmin, getAllUsers);
router.put('/:id', authenticate, updateUser);

export default router;