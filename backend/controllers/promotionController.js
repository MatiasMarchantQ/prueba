import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import InstallationAmount from '../models/InstallationAmounts.js';

export const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.findAll({
            attributes: ['promotion_id', 'promotion', 'installation_amount_id'],
            include: [
              {
                model: InstallationAmount,
                as: 'InstallationAmounts',
                attributes: ['amount'],
              },
              {
                model: PromotionCommune,
                as: 'PromotionCommunes', // Update this line to match the alias name
                attributes: ['commune_id'],
              },
            ],
          });
  
      res.status(200).json(promotions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener promociones' });
    }
  };

export const addPromotionWithCommunes = async (req, res) => {
  const { promotion, installation_amount_id, communes } = req.body; // Incluye un array de IDs de comunas

  try {
    // Crea la nueva promoción
    const newPromotion = await Promotion.create({
      promotion,
      installation_amount_id,
      modified_by_user_id: req.user.user_id, // Asigna el ID del usuario que modifica
      is_active: 1, // Activo por defecto
    });

    // Crea asociaciones para las comunas
    const promotionCommunePromises = communes.map(commune_id => {
      return PromotionCommune.create({
        promotion_id: newPromotion.promotion_id,
        commune_id,
      });
    });

    await Promise.all(promotionCommunePromises);

    res.status(201).json({
      message: 'Promoción creada con éxito',
      promotion: newPromotion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar la promoción y sus asociaciones de comuna' });
  }
};


export const getInstallationAmounts = async (req, res) => {
    try {
      const installationAmounts = await InstallationAmount.findAll({
        attributes: ['installation_amount_id', 'amount'],
      });
  
      res.status(200).json(installationAmounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener montos de instalación' });
    }
  };

//Modificar monto de instalacion para una promocion
export const updateInstallationAmountForPromotion = async (req, res) => {
    try {
      const promotionId = req.params.promotionId;
      const newInstallationAmountId = req.body.installation_amount_id;
  
      const promotion = await Promotion.findByPk(promotionId);
  
      if (!promotion) {
        return res.status(404).json({ message: 'Promoción no encontrada' });
      }
  
      await promotion.update({
        installation_amount_id: newInstallationAmountId,
      });
  
      res.status(200).json({ message: 'Monto de instalación actualizado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar monto de instalación' });
    }
  };