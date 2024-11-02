import express from 'express';
const router = express.Router();
import { getAllUsers, register, updateMyProfile, updateUserByAdmin, getMe, getUserById, registerUserByAdmin, changePassword } from '../controllers/userController.js';
import { authenticate, isAnyRole } from '../middlewares/authMiddleware.js';
import recaptchaMiddleware from '../middlewares/recaptchaMiddleware.js';

//get
router.get('/', authenticate, isAnyRole(['SuperAdmin', 'Administrador', 'Consultor']), getAllUsers);
router.get('/me', authenticate, getMe);
router.get('/:user_id', authenticate, isAnyRole(['SuperAdmin','Administrador', 'Consultor']), getUserById);

//put
router.put('/update', authenticate, recaptchaMiddleware, updateMyProfile);
router.put('/update/:id', authenticate, isAnyRole(['SuperAdmin', 'Administrador']), recaptchaMiddleware, updateUserByAdmin);
router.put('/users/me/password', authenticate, recaptchaMiddleware, changePassword);

//post
router.post('/register', authenticate, isAnyRole(['SuperAdmin']), recaptchaMiddleware, register);
router.post('/admin/register-user', authenticate, isAnyRole(['Administrador']), recaptchaMiddleware, registerUserByAdmin);

export default router;