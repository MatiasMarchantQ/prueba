import {Router} from 'express';
import { login, logout, forgotPassword, resetPassword, changePassword, verifyCode , requestVerificationCode} from '../controllers/authController.js';
import recaptchaMiddleware from '../middlewares/recaptchaMiddleware.js';


const router = Router();

// Rutas de autenticación básica
router.post('/login', recaptchaMiddleware, login);
router.post('/logout', logout);

// Flujo de recuperación de contraseña
router.post('/forgot-password', recaptchaMiddleware, forgotPassword);     // Inicia el proceso y envía el código
router.post('/verify-code', recaptchaMiddleware, verifyCode);            // Verifica el código y genera token de reseteo
router.post('/reset-password', recaptchaMiddleware, resetPassword);       // Cambia la contraseña con el token verificado
router.post('/request-verification-code/:token', recaptchaMiddleware, requestVerificationCode); // Solicitar nuevo código


// Cambio de contraseña obligatorio (primer ingreso o cambio por admin)
router.put('/change-password/:token', changePassword);

export default router;