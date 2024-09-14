import Sales from '../models/Sales.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import User from '../models/Users.js';
import SalesChannel from '../models/SalesChannels.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import CompanyPriority from '../models/CompanyPriorities.js';
import { Op } from 'sequelize';

export const createSale = async (req, res) => {
  try {
    const {
      service_id,
      entry_date,
      client_first_name,
      client_last_name,
      client_rut,
      client_email,
      client_phone,
      client_secondary_phone,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      geo_reference,
      promotion_id,
      additional_comments,
      id_card_image,
      simple_power_image,
      house_image,
      validator_id,
      dispatcher_id,
    } = req.body;

    // Verificar que la region_id sea válida
    const region = await Region.findByPk(region_id);
    if (!region) {
      return res.status(400).json({ message: 'La región seleccionada no existe' });
    }

    // Obtener las comunas asociadas a la región seleccionada
    const commune = await Commune.findByPk(commune_id);
    if (!commune || commune.region_id !== region_id) {
      return res.status(400).json({ message: 'La comuna seleccionada no existe o no está asociada a la región' });
    }

    // Verificar la promoción y obtener el installation_amount_id
    const promotion = await Promotion.findByPk(promotion_id);
    if (!promotion) {
      return res.status(400).json({ message: 'La promoción seleccionada no existe' });
    }

    const installationAmountId = promotion.installation_amount_id;

    // Obtener el usuario actual
    const currentUser = await User.findByPk(req.user.user_id);
    if (!currentUser) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const companyId = currentUser.company_id;

    // Obtener el priority_level asociado al company_id
    const Priority = await CompanyPriority.findOne({
      where: {
        company_id: companyId,
      },
      order: [['priority_level', 'ASC']], // Ajusta el orden según tu necesidad
    });

    if (!Priority) {
      return res.status(400).json({ message: 'No se encontró la prioridad de la compañía' });
    }

    const companyPriorityId = Priority.priority_level;

    // Asignar executive_id solo si el rol es 3 (ejecutivo)
    let executiveId = null;
    if (currentUser.role_id === 3) {
      executiveId = currentUser.user_id; // Usar el user_id del ejecutivo
    }

    // Verificar que el RUT sea único
    const existingRut = await Sales.findOne({ where: { client_rut } });
    if (existingRut) {
      return res.status(400).json({ message: 'El RUT ya existe en la base de datos' });
    }

    // Verificar que el email sea único
    const existingEmail = await Sales.findOne({ where: { client_email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'El email ya existe en la base de datos' });
    }

    const saleData = {
      service_id,
      entry_date,
      sales_channel_id: 1,
      client_first_name,
      client_last_name,
      client_rut,
      client_email,
      client_phone,
      client_secondary_phone,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      geo_reference,
      promotion_id,
      installation_amount_id: installationAmountId,
      additional_comments,
      id_card_image,
      simple_power_image,
      house_image,
      sale_status_id: 1,
      executive_id: executiveId,
      validator_id: null,
      dispatcher_id: null,
      company_id: companyId,
      company_priority_id: companyPriorityId,
    };

    const sale = await Sales.create(saleData);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};


export const getSales = async (req, res) => {
  try {
    const sales = await Sales.findAll();
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sales.findByPk(id);
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      res.json(sale);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sale' });
  }
};

export const updateSale = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sales.findByPk(id);
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      await sale.update(req.body);
      res.json(sale);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating sale' });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sales.findByPk(id);
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      await sale.destroy();
      res.json({ message: 'Sale deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting sale' });
  }
};

export default {
  createSale,
  getSales,
  getSaleById,
  updateSale, 
  deleteSale,
};