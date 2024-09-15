import express from 'express';
const router = express.Router();
import { getAllUsers, register, updateMyProfile, updateUserByAdmin, getMe, registerUserByAdmin } from '../controllers/userController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

//get
router.get('/', authenticate, isAnyRole(['SuperAdmin']), getAllUsers);
router.get('/me', authenticate, getMe);

//put
router.put('/update', authenticate, updateMyProfile);
router.put('/update/:id', authenticate, isAnyRole(['SuperAdmin', 'Administrador']), updateUserByAdmin);

//post
router.post('/register', authenticate, isAnyRole(['SuperAdmin']), register);
router.post('/admin/register-user', authenticate, isAnyRole(['Administrador']), registerUserByAdmin);

export default router;