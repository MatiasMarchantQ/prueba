import express from 'express';
const router = express.Router();
import { getAllUsers, register, updateUser, getMe } from '../controllers/userController.js';
import { authenticate, isSuperAdmin, isExecutive } from '../middlewares/authMiddleware.js';

router.post('/register', authenticate, isSuperAdmin, register);
router.get('/', authenticate, isSuperAdmin, getAllUsers);
router.put('/:id', authenticate, updateUser);
router.get('/me', authenticate, getMe);

export default router;