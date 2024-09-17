import Sales from '../models/Sales.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import User from '../models/Users.js';
import SalesChannel from '../models/SalesChannels.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import CompanyPriority from '../models/CompanyPriorities.js';
import path from 'path';
import fs from 'fs';
import { fetchRegionById } from '../services/dataServices.js';
import { Op } from 'sequelize';
import { Sequelize, DataTypes } from 'sequelize';
import nodemailer from 'nodemailer';

export const createSale = async (req, res) => {
  try {
    const reqBody = Object.keys(req.body).reduce((acc, key) => {
      acc[key.trim()] = req.body[key];
      return acc;
    }, {});

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
      validator_id,
      dispatcher_id,
    } = reqBody;

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const idCardImages = files
      .filter(file => file && file.path)
      .map(file => {
        const ext = path.extname(file.originalname);
        const newFileName = `${client_rut}${ext}`;
        const newFilePath = path.join(path.dirname(file.path), newFileName);

        fs.renameSync(file.path, newFilePath);

        return newFilePath;
      });

    if (idCardImages.length === 0) {
      return res.status(400).json({ message: 'No valid id card images provided' });
    }

    const region = await fetchRegionById(region_id);
    if (!region) {
      return res.status(400).json({ message: 'La región seleccionada no existe' });
    }

    const commune = await Commune.findOne({
      where: {
        commune_id: commune_id,
        region_id: region_id
      }
    });
    if (!commune) {
      return res.status(400).json({ message: 'La comuna seleccionada no existe o no está asociada a la región' });
    }

    const promotion = await Promotion.findByPk(promotion_id);
    if (!promotion) {
      return res.status(400).json({ message: 'La promoción seleccionada no existe' });
    }

    const installationAmountId = promotion.installation_amount_id;

    const currentUser = await User.findByPk(req.user.user_id);
    if (!currentUser) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const companyId = currentUser.company_id;

    const Priority = await CompanyPriority.findOne({
      where: {
        company_id: companyId,
      },
      order: [['priority_level', 'ASC']],
    });

    if (!Priority) {
      return res.status(400).json({ message: 'No se encontró la prioridad de la compañía' });
    }

    const companyPriorityId = Priority.priority_level;

    let executiveId = null;
    if (currentUser.role_id === 3) {
      executiveId = currentUser.user_id;
    }

    const existingRut = await Sales.findOne({ where: { client_rut } });
    if (existingRut) {
      return res.status(400).json({ message: 'El RUT ya existe en la base de datos' });
    }

    const existingEmail = await Sales.findOne({ where: { client_email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'El email ya existe en la base de datos' });
    }

    const saleData = {
      service_id: service_id || null,
      entry_date,
      sales_channel_id: 1,
      client_first_name,
      client_last_name,
      client_rut,
      client_email,
      client_phone,
      client_secondary_phone: client_secondary_phone || null,
      region_id,
      commune_id,
      street: street || null,
      number: number || null,
      department_office_floor: department_office_floor || null,
      geo_reference,
      promotion_id,
      installation_amount_id: installationAmountId,
      additional_comments: additional_comments || null,
      id_card_image: JSON.stringify(idCardImages) || null,
      sale_status_id: 1,
      executive_id: executiveId,
      validator_id: null,
      dispatcher_id: null,
      company_id: companyId,
      company_priority_id: companyPriorityId,
      id_card_image: idCardImages,
      modified_by_user_id: req.user.user_id
    };

    const sale = await Sales.create(saleData);

    if (saleData.sale_status_id === 1) {
      // Configura el transporte de correo
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      const salesChannel = await SalesChannel.findOne({
          where: { sales_channel_id: saleData.sales_channel_id } // Usa el ID del canal desde saleData
      });
    
      // Define los valores necesarios
      const commune = await Commune.findOne({
        where: { commune_id: sale.commune_id } // Asegúrate de que saleData contiene commune_id
      });
      const communeName = commune ? commune.commune_name : 'Comuna no disponible';
      // O consulta a la base de datos si es necesario
      const promotion = await Promotion.findOne({
        where: { promotion_id: sale.promotion_id }
      });      
      const installationAmount = await InstallationAmount.findOne({
        where: { installation_amount_id: promotion.installation_amount_id }
      });
      const executiveName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Ejecutivo no asignado';
      const subject = `${client_last_name}, ${client_first_name} - ${executiveName} - ${communeName} - ${salesChannel ? salesChannel.channel_name : 'Canal no disponible'}`;
      const formattedDate = new Date(entry_date).toLocaleDateString('es-CL'); // Formato dd-mm-aaaa
    
      const message = `
        <p>Estimado/a,</p>
        <p>Se ha registrado una nueva venta en el sistema.</p>
        <p><strong>Detalles de la Venta:</strong></p>
        <ul>
          <li><strong>Fecha:</strong> ${formattedDate}</li>
          <li><strong>Nombre del Cliente:</strong> ${client_first_name} ${client_last_name}</li>
          <li><strong>RUT del Cliente:</strong> ${client_rut}</li>
          <li><strong>Teléfono del Cliente:</strong> ${client_phone}</li>
          <li><strong>Email del Cliente:</strong> ${client_email}</li>
          <li><strong>Dirección:</strong> ${street ? `${street} ${number}` : 'No proporcionada'}</li>
          <li><strong>Comuna:</strong> ${communeName}</li>
          <li><strong>Monto de instalación:</strong> ${installationAmount ? installationAmount.amount : 'No disponible'}</li>
          <li><strong>Promoción:</strong> ${promotion ? promotion.promotion : 'Promoción no disponible'}</li>
          <li><strong>Referencia Geográfica:</strong> ${geo_reference}</li>
          <li><strong>Nombre del Ejecutivo:</strong> ${executiveName}</li>
        </ul>
        <p>Por favor, revise el Canal Ventas ISP.</p>
        <p>Saludos cordiales,</p>
        <p>El equipo de ventas</p>
      `;
    
      // Envía el correo
      await transporter.sendMail({
        from: 'noreply.ingbell@gmail.com',
        to: 'internetsolicitudes@gmail.com',
        subject: subject,
        html: message
      });
    }
    


    res.status(201).json(sale);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

export const getPromotionsByCommune = async (req, res) => {
  try {
    const communeId = req.params.commune_id;
    const promotions = await PromotionCommune.findAll({
      where: { commune_id: communeId },
      attributes: ['promotion_id'],
      include: [
        {
          model: Promotion,
          attributes: ['promotion_id', 'promotion'],
        },
      ],
    });
    res.json(promotions);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error obteniendo promociones', error: error.message });
  }
};

export const getInstallationAmountsByPromotion = async (req, res) => {
  try {
    const promotionId = req.params.promotion_id;
    const promotion = await Promotion.findByPk(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }
    const installationAmountId = promotion.installation_amount_id;
    const installationAmount = await InstallationAmount.findByPk(installationAmountId);
    if (!installationAmount) {
      return res.status(404).json({ message: 'Monto de instalación no encontrado' });
    }
    res.json({ installation_amount_id: installationAmount.installation_amount_id ,amount: installationAmount.amount });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error obteniendo monto de instalación', error: error.message });
  }
};

export const getSales = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 18;
  const offset = (page - 1) * limit;

  // Suponiendo que el company_id y user_id del usuario autenticado están disponibles en req.user
  const user = req.user; // Obtén el usuario desde la sesión o el middleware de autenticación
  const companyId = user.company_id; // Asegúrate de que company_id esté disponible en el objeto usuario
  const roleId = user.role_id; // Obtén el role_id del usuario
  const userId = user.user_id; // Obtén el user_id del usuario autenticado

  try {
    let options = {
      limit,
      offset,
    };

    if (roleId === 2) {
      // Rol 2: Filtra por company_id
      options.where = {
        company_id: companyId,
      };
    } else if (roleId === 3) {
      // Rol 3: Filtra solo por executive_id del usuario autenticado
      options.where = {
        executive_id: userId,
        company_id: companyId,
      };
    }

    // Obtener los datos de ventas con paginación y posible filtrado
    const sales = await Sales.findAll(options);

    // Contar el número total de ventas con el filtro aplicado
    const totalSalesCountOptions = { where: {} };
    
    if (roleId === 2) {
      totalSalesCountOptions.where.company_id = companyId;
    } else if (roleId === 3) {
      totalSalesCountOptions.where.executive_id = userId;
      totalSalesCountOptions.where.company_id = companyId;
    }

    const totalSales = await Sales.count(totalSalesCountOptions);

    // Calcular el número total de páginas
    const totalPages = Math.ceil(totalSales / limit);

    res.json({
      sales,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};




export const getExecutiveSales = async (req, res) => {
  try {
    // Obtén el user_id del usuario autenticado
    const userId = req.user.user_id;

    // Obtener el company_id del usuario autenticado desde la tabla User
    const user = await User.findByPk(userId, {
      attributes: ['company_id'], // Solo necesitas company_id para la consulta
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const companyId = user.company_id;

    // Verificar si el user_id es un executive_id en la tabla Sales
    const sales = await Sales.findAll({
      where: {
        executive_id: userId,
        company_id: companyId,
      },
      attributes: [
        'sale_id',
        'service_id',
        'entry_date',
        'sales_channel_id',
        'client_first_name',
        'client_last_name',
        'client_rut',
        'client_email',
        'client_phone',
        'client_secondary_phone',
        'region_id',
        'commune_id',
        'street',
        'number',
        'department_office_floor',
        'geo_reference',
        'promotion_id',
        'installation_amount_id',
        'additional_comments',
        'id_card_image',
        'simple_power_image',
        'house_image',
        'sale_status_id',
        'executive_id',
        'validator_id',
        'dispatcher_id',
        'created_at',
        'updated_at',
        'modified_by_user_id',
        'company_id',
        'company_priority_id',
      ],
    });

    if (sales.length === 0) {
      return res.status(404).json({ message: 'No sales found for the executive in this company' });
    }

    res.json(sales);
  } catch (error) {
    console.error('Error fetching executive sales:', error);
    res.status(500).json({ message: 'Error fetching executive sales', error: error.message });
  }
};
// Asegúrate de tener esta función o ajusta según tu implementación

export const updateSale = async (req, res) => {
  try {
    const userId = req.user.user_id; // ID del usuario autenticado
    const roleId = req.user.role_id; // Rol del usuario autenticado
    const saleId = req.params.sale_id; // ID de la venta a actualizar

    const {
      service_id,
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
      sale_status_id
    } = req.body;

    // Verifica que la venta exista
    const sale = await Sales.findByPk(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Verifica permisos para actualizar
    if (sale.sale_status_id === 1) {
      // Estado 1: Validador puede actualizar a 2, 3, 4 o 7
      if (roleId !== 4) { // Rol 4 es Validador
        return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
      }
    } else if (sale.sale_status_id === 3) {
      // Estado 3: Validador puede actualizar a 2, 4 o 7
      if (roleId !== 4) {
        return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
      }
    } else if (sale.sale_status_id === 4) {
      // Estado 4: Solo el Ejecutivo que creó la venta puede actualizarla
      if (roleId !== 3 || sale.executive_id !== userId) { // Rol 3 es Ejecutivo
        return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
      }
    } else if (sale.sale_status_id === 2) {
      // Estado 2: Despachador puede actualizar a 1, 2, o 7
      if (roleId !== 5) { // Rol 5 es Despachador
        return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
      }
    } else if (sale.sale_status_id === 7) {
      // Estado 7: Solo puede ser visto o filtrado, no actualizado.
      return res.status(403).json({ message: 'No puedes actualizar esta venta, ya está archivada' });
    } else {
      // Otros roles como SuperAdmin y Administrador tienen permisos generales
      if (![1, 2].includes(roleId)) { // Roles 1 y 2 son SuperAdmin y Administrador
        return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
      }
    }

    // Verifica la validez de la región, comuna y promoción
    if (region_id) {
      const region = await fetchRegionById(region_id);
      if (!region) {
        return res.status(400).json({ message: 'La región seleccionada no existe' });
      }
      
      const commune = await Commune.findOne({ where: { commune_id, region_id } });
      if (!commune) {
        return res.status(400).json({ message: 'La comuna seleccionada no existe o no está asociada a la región' });
      }
    }

    if (promotion_id) {
      const promotion = await Promotion.findByPk(promotion_id);
      if (!promotion) {
        return res.status(400).json({ message: 'La promoción seleccionada no existe' });
      }
    }

    // Actualiza el validator_id si el estado es 2
    let validator_id = sale.validator_id;
    if (sale_status_id === 2) {
      validator_id = userId;
    }

    // Verifica que el email y RUT sean únicos si se actualizan
    if (client_email && client_email !== sale.client_email) {
      const existingEmail = await Sales.findOne({ where: { client_email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya existe en la base de datos' });
      }
    }

    if (client_rut && client_rut !== sale.client_rut) {
      const existingRut = await Sales.findOne({ where: { client_rut } });
      if (existingRut) {
        return res.status(400).json({ message: 'El RUT ya existe en la base de datos' });
      }
    }

    // Prepara los datos para la actualización
    const updatedSaleData = {
      service_id: service_id || null,
      client_first_name,
      client_last_name,
      client_rut,
      client_email,
      client_phone,
      client_secondary_phone: client_secondary_phone || null,
      region_id,
      commune_id,
      street: street || null,
      number,
      department_office_floor: department_office_floor || null,
      geo_reference,
      promotion_id,
      additional_comments: additional_comments || null,
      sale_status_id,
      validator_id,
      modified_by_user_id: userId
    };

    await sale.update(updatedSaleData);

    res.status(200).json({ message: 'Venta actualizada con éxito', sale });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error al actualizar la venta', error: error.message });
  }
};




export const updateSaleByExecutive = async (req, res) => {
  try {
    const userId = req.user.user_id; // ID del usuario autenticado
    const saleId = req.params.sale_id; // ID de la venta a actualizar

    const {
      service_id,
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
    } = req.body;

    // Verifica que la venta exista
    const sale = await Sales.findByPk(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Verifica que el ejecutivo sea el correcto
    if (sale.executive_id !== userId) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
    }

    // Verifica la validez de la región, comuna y promoción
    if (region_id) {
      const region = await fetchRegionById(region_id);
      if (!region) {
        return res.status(400).json({ message: 'La región seleccionada no existe' });
      }
      
      const commune = await Commune.findOne({ where: { commune_id, region_id } });
      if (!commune) {
        return res.status(400).json({ message: 'La comuna seleccionada no existe o no está asociada a la región' });
      }
    }

    if (promotion_id) {
      const promotion = await Promotion.findByPk(promotion_id);
      if (!promotion) {
        return res.status(400).json({ message: 'La promoción seleccionada no existe' });
      }
    }

    // Prepara los datos para la actualización
    const updatedSaleData = {
      service_id,
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
      sale_status_id: 1, // Asumimos que el ejecutivo puede solo actualizar a 4
      modified_by_user_id: userId // Actualiza el campo de usuario que realizó la modificación
    };

    // Actualiza la venta
    await sale.update(updatedSaleData);

    res.status(200).json({ message: 'Venta actualizada con éxito', sale });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error al actualizar la venta', error: error.message });
  }
};

export default {
  createSale,
  getPromotionsByCommune,
  getInstallationAmountsByPromotion,
  getSales,
  getExecutiveSales,
  updateSale,
  updateSaleByExecutive,
};