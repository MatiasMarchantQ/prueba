import express from 'express';
const router = express.Router();
import { getAllUsers, register, updateUser, getMe, registerUserByAdmin } from '../controllers/userController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

router.post('/register', authenticate, isAnyRole(['SuperAdmin']), register);
router.post('/admin/register-user', authenticate, isAnyRole(['Administrador']), registerUserByAdmin);
router.get('/', authenticate, isAnyRole(['SuperAdmin']), getAllUsers);
router.put('/:id', authenticate, updateUser);
router.get('/me', authenticate, getMe);

export default router;