import {Router} from 'express';
import { login, logout, forgotPassword, resetPassword, changePassword } from '../controllers/authController.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.put('/change-password/:token', authController.changePassword);

export default router;