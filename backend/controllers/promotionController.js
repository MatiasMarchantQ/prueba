import Sale from '../models/Sales.js'
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import { Op } from 'sequelize';


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
                as: 'PromotionCommunes',
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

  export const getPromotionsByUser = async (req, res) => {
    try {
      const sales = await Sale.findAll({
        where: {
          executive_id: req.user.user_id,
        },
        include: [
          {
            model: Promotion,
            as: 'promotion',
            attributes: ['promotion_id', 'promotion'],
          },
        ],
      });
  
      if (!sales) {
        return res.status(404).json({ message: 'No se encontraron ventas' });
      }
  
      const promotions = [...new Map(sales.map((sale) => [sale.promotion_id, sale.promotion])).values()].map((promotion) => ({
        promotion_id: promotion.promotion_id,
        promotion: promotion.promotion,
      }));
      
      const result = promotions;
        
      res.status(200).json(promotions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener promociones' });
    }
  };

  export const getInstallationAmountsByUser = async (req, res) => {
    try {
      const sales = await Sale.findAll({
        where: {
          executive_id: req.user.user_id,
        },
        include: [
          {
            model: InstallationAmount,
            as: 'installationAmount',
            attributes: ['amount'],
          },
        ],
        attributes: ['sale_id', 'installation_amount_id'],
      });
  
      if (!sales) {
        return res.status(404).json({ message: 'No se encontraron ventas' });
      }
  
      const installationAmounts = [...new Map(sales.map((sale) => [sale.installation_amount_id, sale])).values()].map((sale) => ({
        sale_id: sale.sale_id,
        installation_amount_id: sale.installation_amount_id,
        amount: sale.installationAmount.amount,
      }));
  
      res.status(200).json(installationAmounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener montos de instalación' });
    }
  };

  export const addPromotionWithInstallationAmount = async (req, res) => {
    const { promotion, installationAmountId } = req.body;
  
    try {
      // Verifica si la promoción ya existe
      const existingPromotion = await Promotion.findOne({
        where: {
          promotion: {
            [Op.like]: `%${promotion.toLowerCase()}%`,
          },
          installation_amount_id: installationAmountId,
        },
      });
  
      if (existingPromotion) {
        return res.status(400).json({
          message: 'La promoción ya existe',
        });
      }
  
      // Crea la nueva promoción
      const newPromotion = await Promotion.create({
        promotion,
        installation_amount_id: installationAmountId,
        modified_by_user_id: req.user.user_id,
        is_active: 1,
      });
  
      res.status(201).json({
        message: 'Promoción creada con éxito',
        promotion: newPromotion,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al agregar la promoción' });
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

  //Modificar monto de instalación
  export const updateInstallationAmount = async (req, res) => {
    try {
      const installationAmountId = req.params.installationAmountId;
      const newAmount = req.body.amount;
  
      const installationAmount = await InstallationAmount.findByPk(installationAmountId);
      if (!installationAmount) {
        return res.status(404).json({ message: 'Monto de instalación no encontrado' });
      }
  
      await installationAmount.update({
        amount: newAmount,
      });
  
      res.status(200).json({ message: 'Monto de instalación actualizado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar monto de instalación' });
    }
  };

  export const assignPromotionsToCommune = async (req, res) => {
    const { communeId } = req.params;
    const { promotionIds } = req.body;
  
    if (!promotionIds || !Array.isArray(promotionIds)) {
      return res.status(400).json({ message: 'Promotion IDs are required' });
    }
  
    try {
      const commune = await Commune.findByPk(communeId);
      if (!commune) {
        return res.status(404).json({ message: 'Commune not found' });
      }
  
      // Verificar que las promociones existan
      const promotions = await Promotion.findAll({ where: { promotion_id: promotionIds } });
      if (promotions.length !== promotionIds.length) {
        return res.status(400).json({ message: 'One or more promotions do not exist' });
      }
  
      // Verificar si la promoción ya está asociada a la comuna
      const existingAssociations = await PromotionCommune.findAll({
        where: {
          commune_id: commune.commune_id,
          promotion_id: promotionIds,
        },
      });
  
      // Actualizar o crear asociaciones
      await Promise.all(promotionIds.map(async (promotionId) => {
        const existingAssociation = existingAssociations.find((association) => association.promotion_id === promotionId);
        if (existingAssociation) {
          // Actualizar asociación existente
          await existingAssociation.update({ is_active: 1 });
        } else {
          // Crear nueva asociación
          await PromotionCommune.create({
            promotion_id: promotionId,
            commune_id: commune.commune_id,
            is_active: 1,
          });
        }
      }));
  
      res.status(201).json({ message: 'Promotions assigned to commune successfully' });
    } catch (error) {
      console.error('Error assigning promotions to commune:', error);
      res.status(500).json({ message: 'Error assigning promotions to commune', error: error.message });
    }
  };

  export const editPromotion = async (req, res) => {
    const { promotionId } = req.params;
    const { promotion, installation_amount_id } = req.body;
  
    try {
      const promotionToUpdate = await Promotion.findByPk(promotionId);
      if (!promotionToUpdate) {
        return res.status(404).json({ message: 'Promoción no encontrada' });
      }
  
      // Actualizar promoción
      await promotionToUpdate.update({
        promotion,
        installation_amount_id,
      });
  
      res.status(200).json({ message: 'Promoción actualizada con éxito' });
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
      res.status(500).json({ message: 'Error al actualizar promoción', error: error.message });
    }
  };

  export const disablePromotionsForCommune = async (req, res) => {
    const { communeId } = req.params;
    const { promotionIds } = req.body;
  
    try {
      await PromotionCommune.update(
        { is_active: 0 },
        {
          where: {
            commune_id: communeId,
            promotion_id: promotionIds,
          },
        }
      );
  
      res.status(200).json({ message: 'Promociones deshabilitadas con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al deshabilitar promociones' });
    }
  };
  export const getPromotionsAll = async (req, res) => {
    try {
      const limit = 100;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
  
      const regionId = req.query.region_id ? parseInt(req.query.region_id) : null;
      const communeId = req.query.commune_id ? parseInt(req.query.commune_id) : null;
      const promotionId = req.query.promotion_id ? parseInt(req.query.promotion_id) : null;
  
      let whereCondition = {};
      if (regionId) whereCondition.region_id = regionId;
  
      let includeConditions = [
        {
          model: Commune,
          as: 'communes',
          required: false,
          where: communeId ? { commune_id: communeId } : {},
          include: [
            {
              model: PromotionCommune,
              as: 'promotionCommunes',
              required: false,
              where: { is_active: 1 },
              include: [
                {
                  model: Promotion,
                  required: false,
                  where: promotionId ? { promotion_id: promotionId } : {}, // <--- Modificado
                  include: [
                    {
                      model: InstallationAmount,
                      attributes: ['installation_amount_id', 'amount'],
                      required: false,
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];
  
      const regions = await Region.findAll({
        where: whereCondition,
        include: includeConditions,
        order: [
          ['region_id', 'ASC'],
          [{ model: Commune, as: 'communes' }, 'commune_name', 'ASC'],
          [{ model: Commune, as: 'communes' }, { model: PromotionCommune, as: 'promotionCommunes' }, { model: Promotion, as: 'Promotion' }, 'promotion_id', 'ASC'],
        ],
        limit,
        offset,
      });
  
      const count = await Region.count({
        where: whereCondition,
        include: includeConditions,
        distinct: true
      });
  
      const restructuredData = regions.map(region => ({
        region_id: region.region_id,
        region_name: region.region_name,
        communes: region.communes.map(commune => ({
          commune_id: commune.commune_id,
          commune_name: commune.commune_name,
          promotions: commune.promotionCommunes
            ? commune.promotionCommunes.map(pc => {
              if (pc.Promotion) {
                return {
                  promotion_id: pc.Promotion.promotion_id,
                  promotion: pc.Promotion.promotion,
                  installation_amount_id: pc.Promotion.InstallationAmounts[0]?.installation_amount_id,
                  installation_amount: pc.Promotion.InstallationAmounts[0]?.amount,
                };
              } else {
                return null;
              }
            }).filter(Boolean)
            : [],
        })),
      }));
  
      res.status(200).json({
        data: restructuredData,
        pagination: {
          limit,
          offset,
          total: count,
        },
      });
    } catch (error) {
      console.error('Error fetching regions with communes and promotions:', error);
      res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
  };
