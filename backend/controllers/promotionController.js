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

  export const getInstallationAmountsByUser  = async (req, res) => {
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
  
      if (!sales || sales.length === 0) {
        return res.status(404).json({ message: 'No se encontraron ventas' });
      }
  
      // Usamos un objeto para almacenar montos únicos
      const uniqueInstallationAmounts = {};
  
      sales.forEach((sale) => {
        if (sale.installationAmount) {
          const { installation_amount_id, amount } = sale.installationAmount;
  
          // Solo agregamos si no existe ya en el objeto
          if (!uniqueInstallationAmounts[installation_amount_id]) {
            uniqueInstallationAmounts[installation_amount_id] = {
              installation_amount_id,
              amount,
            };
          }
        }
      });
  
      // Convertimos el objeto a un arreglo
      const installationAmounts = Object.values(uniqueInstallationAmounts);
  
      res.status(200).json(installationAmounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener montos de instalación: ' + error.message });
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
  
      res.status(201).json({ mensaje: 'Promociones asignadas a la comuna exitosamente' });
    } catch (error) {
      console.error('Error al asignar promociones a la comuna:', error);
      res.status(500).json({ mensaje: 'Error al asignar promociones a la comuna', error: error.message });
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
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const offset = (page - 1) * limit;
  
      const regionId = req.query.region_id ? parseInt(req.query.region_id) : null;
      const communeId = req.query.commune_id ? parseInt(req.query.commune_id) : null;
      const promotionId = req.query.promotion_id ? parseInt(req.query.promotion_id) : null;
      const installationAmountId = req.query.installation_amount_id ? parseInt(req.query.installation_amount_id) : null;

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
              include: [
                {
                  model: Promotion,
                  required: false,
                  where: {
                    ...(promotionId ? { promotion_id: promotionId } : {}),
                    ...(installationAmountId ? { installation_amount_id: installationAmountId } : {}),
                  },
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
  
      const { count, rows: regions } = await Region.findAndCountAll({
        where: whereCondition,
        include: includeConditions,
        order: [
          ['region_id', 'ASC'],
          [{ model: Commune, as: 'communes' }, 'commune_name', 'ASC'],
          [{ model: Commune, as: 'communes' }, { model: PromotionCommune, as: 'promotionCommunes' }, { model: Promotion, as: 'Promotion' }, 'promotion_id', 'ASC'],
        ],
        limit,
        offset,
        distinct: true
      });
  
      const installationAmounts = await InstallationAmount.findAll();

      const restructuredData = regions.map(region => ({
        region_id: region.region_id,
        region_name: region.region_name,
        communes: region.communes.map(commune => ({
          commune_id: commune.commune_id,
          commune_name: commune.commune_name,
          is_active: commune.is_active,
          promotions: commune.promotionCommunes
            ? commune.promotionCommunes.map(pc => {
              if (pc.Promotion) {
                const installationAmount = installationAmounts.find(amount => amount.installation_amount_id === pc.Promotion.installation_amount_id);
                return {
                  promotion_id: pc.Promotion.promotion_id,
                  promotion: pc.Promotion.promotion,
                  installation_amount_id: pc.Promotion.installation_amount_id,
                  installation_amount: installationAmount ? installationAmount.amount : null,
                  is_active: pc.is_active,
                };
              } else {
                return null;
              }
            }).filter(Boolean)
            : [],
        })),
      }));
  
      const totalPages = Math.ceil(count / limit);
  
      res.status(200).json({
        data: restructuredData,
        pagination: {
          limit,
          page,
          total: count,
          totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos', error: error.message });
    }
  };

  export const getCommuneDetails = async (req, res) => {
    try {
      const { communeId } = req.params;
  
      const commune = await Commune.findOne({
        where: { commune_id: communeId },
        attributes: ['commune_id', 'commune_name',  'is_active'],
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['region_id', 'region_name'],
          },
          {
            model: PromotionCommune,
            as: 'promotionCommunes',
            include: [
              {
                model: Promotion,
                attributes: ['promotion_id', 'promotion', 'installation_amount_id'],
              },
            ],
          },
        ],
      });
  
      if (!commune) {
        return res.status(404).json({ message: 'Comuna no encontrada' });
      }
  
      // Obtener todos los montos de instalación
      const installationAmounts = await InstallationAmount.findAll();
      const installationAmountMap = new Map(installationAmounts.map(ia => [ia.installation_amount_id, ia.amount]));
  
      const formattedResponse = {
        commune_id: commune.commune_id,
        commune_name: commune.commune_name,
        is_active: commune.is_active,
        region: {
          region_id: commune.region.region_id,
          region_name: commune.region.region_name,
        },
        current_promotions: commune.promotionCommunes.map(pc => ({
          promotion_id: pc.Promotion.promotion_id,
          promotion: pc.Promotion.promotion,
          installation_amount_id: pc.Promotion.installation_amount_id,
          installation_amount: installationAmountMap.get(pc.Promotion.installation_amount_id) || null,
          is_active: pc.is_active,
        })),
      };
  
      res.status(200).json(formattedResponse);
    } catch (error) {
      console.error('Error al obtener detalles de edición de la comuna:', error);
      res.status(500).json({ message: 'Error al obtener detalles de edición de la comuna', error: error.message });
    }
  };
  
  export const updateCommuneDetails = async (req, res) => {
    try {
      const { communeId } = req.params;
      const { commune_name, promotions, is_active } = req.body;
  
      // 1. Buscar la comuna
      const commune = await Commune.findByPk(communeId);
      if (!commune) {
        return res.status(404).json({ message: 'Comuna no encontrada' });
      }
  
      // 2. Actualizar el nombre y el estado de la comuna
      const updateData = {};
      if (commune_name !== undefined) {
        updateData.commune_name = commune_name;
      }
      if (is_active !== undefined) {
        updateData.is_active = is_active ? 1 : 0;
      }
      if (Object.keys(updateData).length > 0) {
        await commune.update(updateData);
      }
  
      // 3. Actualizar promociones y montos de instalación
      if (promotions && Array.isArray(promotions)) {
        for (const promo of promotions) {
          const { promotion_id, promotion, installation_amount_id, installation_amount, is_active: promo_is_active } = promo;
      
          // Verificar si la promoción existe
          let promotionRecord = await Promotion.findByPk(promotion_id);
      
          if (promotionRecord) {
            // Si existe, actualizarla
            await promotionRecord.update({ promotion, installation_amount_id });
          } else {
            // Si no existe, crearla
            promotionRecord = await Promotion.create({
              promotion_id,
              promotion,
              installation_amount_id
            });
          }
      
          // Actualizar el monto de instalación
          // if (installation_amount_id && installation_amount !== undefined) {
          //   await InstallationAmount.upsert({
          //     installation_amount_id,
          //     amount: installation_amount
          //   });
          // }
      
          // Actualizar o crear la asociación PromotionCommune
          const promotionCommuneRecord = await PromotionCommune.findOne({
            where: {
              promotion_id: promotionRecord.promotion_id,
              commune_id: communeId
            }
          });
                

          if (promotionCommuneRecord) {
            await promotionCommuneRecord.update({ is_active: promo.is_active ? 1 : 0 });
          } else {
            await PromotionCommune.create({
              promotion_id: promotionRecord.promotion_id,
              commune_id: communeId,
              is_active: promo.is_active ? 1 : 0
            });
          }
        }
      }
  
      // 4. Obtener los detalles actualizados de la comuna
      const updatedCommune = await Commune.findOne({
        where: { commune_id: communeId },
        include: [
          {
            model: PromotionCommune,
            as: 'promotionCommunes',
            include: [
              {
                model: Promotion,
                include: [
                  {
                    model: InstallationAmount,
                    attributes: ['amount'],
                  },
                ],
              },
            ],
          },
        ],
      });
  
      // 5. Formatear la respuesta
      const formattedResponse = {
        commune_id: updatedCommune.commune_id,
        commune_name: updatedCommune.commune_name,
        is_active: updatedCommune.is_active,
        current_promotions: updatedCommune.promotionCommunes.map(pc => ({
          promotion_id: pc.Promotion.promotion_id,
          promotion: pc.Promotion.promotion,
          installation_amount_id: pc.Promotion.installation_amount_id,
          installation_amount: pc.Promotion.InstallationAmount ? pc.Promotion.InstallationAmount.amount : null,
          is_active: pc.is_active,
        })),
      };
  
      res.status(200).json({ 
        message: 'Detalles de la comuna actualizados con éxito',
        commune: formattedResponse
      });
    } catch (err) {
  console.error('Error detallado:', err);
  if (err.name === 'SequelizeValidationError') {
    res.status(400).json({ message: 'Error de validación', errors: err.errors });
  } else if (err.name === 'SequelizeDatabaseError') {
    res.status(500).json({ message: 'Error de base de datos', error: err.message, sql: err.sql });
  } else {
    res.status(500).json({ message: 'Error al actualizar detalles de la comuna', error: err.message });
  }
}
  };