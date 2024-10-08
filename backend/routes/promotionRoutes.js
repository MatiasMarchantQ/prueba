import { Router } from 'express';
import { getPromotionsAll, addPromotionWithInstallationAmount, getPromotionsByUser, getInstallationAmountsByUser , editPromotion, getInstallationAmounts, getPromotions, updateInstallationAmountForPromotion, assignPromotionsToCommune, disablePromotionsForCommune, updateInstallationAmount} from '../controllers/promotionController.js';
import { authenticate } from '../middlewares/authMiddleware.js'; // Asegúrate de importar el middleware de autenticación

const router = Router();

//Devuelve lista de promociones
router.get('/', authenticate, getPromotions);

router.get('/by-user', authenticate, getPromotionsByUser);

router.get('/installationAmountsByUser', authenticate, getInstallationAmountsByUser);

//Devuelve la cantidad de instalaciones por una promocion especifica
router.get('/installation-amounts', authenticate, getInstallationAmounts);

//Devuelve todas las promociones, comunas y regiones
router.get('/all', authenticate, getPromotionsAll);


//Actualiza el monto de instalacion para una promocion especifica. El :promotionId es la promo a actualizar
router.patch('/promotions/:promotionId/installation-amount', authenticate, updateInstallationAmountForPromotion);

router.put('/installation-amounts/:installationAmountId', updateInstallationAmount);

//Crea nuevas promociones
router.post('/', authenticate, addPromotionWithInstallationAmount);

//Asigna promociones a una comuna especifica. El :communeId es la comuna a la que se le asignara la o las promociones
router.post('/communes/:communeId/promotions', authenticate , assignPromotionsToCommune);

//Actualiza una promocion existente
router.patch('/:promotionId', authenticate, editPromotion);

// Deshabilitar promociones por comuna
router.patch('/communes/:communeId/promotions/disable', authenticate, disablePromotionsForCommune);

export default router;
