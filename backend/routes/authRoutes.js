import {Router} from 'express';
import { login, logout, forgotPassword, resetPassword, changePassword } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/changepassword/:token', changePassword);

export default router;