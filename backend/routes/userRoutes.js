import express from 'express';
const router = express.Router();
import { getAllUsers, register, updateMyProfile, updateUserByAdmin, getMe, getUserById, registerUserByAdmin, changePassword } from '../controllers/userController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';

//get
router.get('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador']), getAllUsers);
router.get('/me', authenticate, getMe);
router.get('/:user_id', authenticate, isAnyRole(['SuperAdmin','Administrador']), getUserById);

//put
router.put('/update', authenticate, updateMyProfile);
router.put('/update/:id', authenticate, isAnyRole(['SuperAdmin', 'Administrador']), updateUserByAdmin);
router.put('/users/me/password', authenticate, changePassword);

//post
router.post('/register', authenticate, isAnyRole(['SuperAdmin']), register);
router.post('/admin/register-user', authenticate, isAnyRole(['Administrador']), registerUserByAdmin);

export default router;