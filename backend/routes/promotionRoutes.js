import { Router } from 'express';
import { addPromotionWithCommunes, getInstallationAmounts, getPromotions, updateInstallationAmountForPromotion} from '../controllers/promotionController.js';
import { authenticate } from '../middlewares/authMiddleware.js'; // Asegúrate de importar el middleware de autenticación

const router = Router();

// Ruta para crear promoción con comunas
router.get('/', authenticate, getPromotions);
router.get('/installation-amounts', getInstallationAmounts);
router.patch('/promotions/:promotionId/installation-amount', updateInstallationAmountForPromotion);

router.post('/', authenticate, addPromotionWithCommunes);

// Otras rutas para editar, eliminar, etc.

export default router;
