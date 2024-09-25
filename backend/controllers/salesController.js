import Sales from '../models/Sales.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import User from '../models/Users.js';
import Role from '../models/Roles.js';
import SalesChannel from '../models/SalesChannels.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import Company from '../models/Companies.js';
import CompanyPriority from '../models/CompanyPriorities.js';
import SaleStatus from '../models/SaleStatuses.js';
import SaleStatusReason from '../models/SaleStatusReason.js';
import path from 'path';
import fs from 'fs';
import { fetchRegionById } from '../services/dataServices.js';
import { Op } from 'sequelize';
import { Sequelize, DataTypes } from 'sequelize';
import { sendEmailNotification } from '../services/emailService.js';

const handleFileRenaming = (files, clientRut) => {
  if (files.length > 3) throw new Error('You can upload up to 3 images.');

  return files
    .slice(0, 3) // Limitar a 3 imágenes
    .filter(file => file && file.path) // Asegúrate de que file.path esté disponible
    .map(file => {
      const ext = path.extname(file.originalname);
      const newFileName = `${clientRut}_${Date.now()}${ext}`;
      const newFilePath = path.join(path.dirname(file.path), newFileName);
      fs.renameSync(file.path, newFilePath);
      return {
        filename: newFileName,
        path: newFilePath
      };
    });
};

const validateInputs = async (reqBody) => {
  const { region_id, commune_id, promotion_id, sale_status_id, sale_status_reason_id } = reqBody;

  const region = await fetchRegionById(region_id);
  if (!region) throw new Error('La región seleccionada no existe');

  const commune = await Commune.findOne({ where: { commune_id, region_id } });
  if (!commune) throw new Error('La comuna seleccionada no existe o no está asociada a la región');

  const promotion = await Promotion.findByPk(promotion_id);
  if (!promotion) throw new Error('La promoción seleccionada no existe');

  const saleStatus = await SaleStatus.findByPk(sale_status_id);
  if (!saleStatus) throw new Error('El estado de venta seleccionado no existe');

  const saleStatusReason = await SaleStatusReason.findOne({
    where: {
      sale_status_id,
      sale_status_reason_id,
    },
  });
  if (!saleStatusReason) throw new Error('El motivo de estado de venta no está asociado al estado de venta');

  return promotion;
};

const createSaleData = (reqBody, idCardImages, currentUser, installationAmountId, companyPriorityId) => {
  const { service_id, entry_date, client_first_name, client_last_name, client_rut, client_email, client_phone, client_secondary_phone, region_id, commune_id, street, number, department_office_floor, geo_reference, promotion_id, additional_comments } = reqBody;

  const idCardImagePaths = idCardImages.map((image) => image.path);
  const saleStatusId = reqBody.sale_status_id;
  const saleStatusReasonId = saleStatusId === 1 ? null : reqBody.sale_status_reason_id || null;

  return {
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
    id_card_image: idCardImagePaths.join(','),
    sale_status_id: 1,
    sale_status_reason_id: saleStatusReasonId,
    executive_id: currentUser.role_id === 3 ? currentUser.user_id : null,
    validator_id: null,
    dispatcher_id: null,
    company_id: currentUser.company_id,
    company_priority_id: companyPriorityId,
    modified_by_user_id: currentUser.user_id
  };
};

export const createSale = async (req, res) => {
  try {
    // Normalizar el cuerpo de la solicitud
    const reqBody = Object.keys(req.body).reduce((acc, key) => {
      acc[key.trim()] = req.body[key];
      return acc;
    }, {});

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const idCardImages = handleFileRenaming(files, reqBody.client_rut);
    if (idCardImages.length === 0) {
      return res.status(400).json({ message: 'No valid id card images provided' });
    }

    // Validar entradas
    const promotion = await validateInputs(reqBody);
    
    // Obtener información del usuario actual
    const currentUser = await User.findByPk(req.user.user_id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener prioridad de la compañía
    const companyPriority = await CompanyPriority.findOne({ 
      where: { company_id: currentUser.company_id }, 
      order: [['priority_level', 'ASC']] 
    });
    if (!companyPriority) {
      return res.status(404).json({ message: 'No se encontró la prioridad de la compañía' });
    }

    // Verificar existencia del RUT y email
    const existingRut = await Sales.findOne({ where: { client_rut: reqBody.client_rut } });
    if (existingRut) {
      return res.status(400).json({ message: 'El RUT ya existe en la base de datos' });
    }

    const existingEmail = await Sales.findOne({ where: { client_email: reqBody.client_email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'El email ya existe en la base de datos' });
    }

    // Crear los datos de la venta
    const saleData = createSaleData(reqBody, idCardImages, currentUser, promotion.installation_amount_id, companyPriority.priority_level);
    const sale = await Sales.create(saleData);

    // Enviar notificación por correo si la venta se encuentra en estado inicial
    if (saleData.sale_status_id === 1) {
      await sendEmailNotification(sale, currentUser, reqBody, idCardImages);
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};




export const getSales = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 18;
  const offset = (page - 1) * limit;

  const { company_id: companyId, role_id: roleId, user_id: userId } = req.user;

  try {
    const where = buildWhereConditions(roleId, companyId, userId);
    const order = await buildOrderConditions(companyId);
    
    const sales = await Sales.findAll({
      limit,
      offset,
      where,
      include: getSalesIncludes(),
      order: [...order, ['created_at', 'DESC']],
    });

    const totalSales = await getTotalSalesCount(where, roleId, companyId, userId);
    const totalPages = Math.ceil(totalSales / limit);

    res.json({ sales, totalPages, currentPage: page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};

const buildWhereConditions = (roleId, companyId, userId) => {
  const where = {};

  if (roleId === 2) {
    where.company_id = companyId;
  } else if (roleId === 3) {
    where.executive_id = userId;
  }

  // Sale status filters based on role
  if (roleId === 3) {
    where.sale_status_id = [1, 4];
  } else if (roleId === 4) {
    where.sale_status_id = [1, 3];
  } else if (roleId === 5) {
    where.sale_status_id = [2, 5, 6];
  }

  return where;
};

const buildOrderConditions = async (companyId) => {
  const companyPriorities = await CompanyPriority.findAll({
    where: { company_id: companyId },
    attributes: ['priority_level'],
  });

  const priorityLevels = companyPriorities.map(priority => priority.priority_level);
  const order = [];

  if (priorityLevels.length > 0) {
    order.push(Sequelize.literal(`FIELD(company_priority_id, ${priorityLevels.join(',')})`));
  }

  return order;
};

const getSalesIncludes = () => [
  {
    model: SalesChannel,
    as: 'salesChannel',
    attributes: ['channel_name'],
  },
  {
    model: Region,
    as: 'region',
    attributes: ['region_name'],
  },
  {
    model: Commune,
    as: 'commune',
    attributes: ['commune_name'],
  },
  {
    model: Promotion,
    as: 'promotion',
    attributes: ['promotion'],
  },
  {
    model: InstallationAmount,
    as: 'installationAmount',
    attributes: ['amount'],
  },
  {
    model: Company,
    as: 'company',
    attributes: ['company_name'],
  },
  {
    model: SaleStatus,
    as: 'saleStatus',
    attributes: ['status_name'],
  },
  {
    model: SaleStatusReason,
    as: 'reason',
    attributes: ['reason_name'],
  }, 
  {
    model: User,
    as: 'executive',
    attributes: [
      'first_name',
      'second_name',
      'last_name',
      'second_last_name',
      'rut',
      'email',
      'phone_number',
    ],
    include: [{
      model: Role,
      as: 'role',
      attributes: ['role_name'],
    }],
  },
];

const getTotalSalesCount = async (where, roleId, companyId, userId) => {
  const totalSalesCountOptions = { where: {} };

  if (roleId === 2) {
    totalSalesCountOptions.where.company_id = companyId;
  } else if (roleId === 3) {
    totalSalesCountOptions.where.executive_id = userId;
  }

  if (roleId === 3) {
    totalSalesCountOptions.where.sale_status_id = [1, 4];
  } else if (roleId === 4) {
    totalSalesCountOptions.where.sale_status_id = [1, 3];
  } else if (roleId === 5) {
    totalSalesCountOptions.where.sale_status_id = [2, 5, 6];
  }

  return await Sales.count(totalSalesCountOptions);
};

export const getSaleById = async (req, res) => {
  try {
    const saleId = req.params.sale_id;
    let options = {
      where: { sale_id: saleId },
      include: [
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['channel_name'],
        },
        {
          model: Region,
          as: 'region',
          attributes: ['region_name'],
        },
        {
          model: Commune,
          as: 'commune',
          attributes: ['commune_name'],
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['promotion'],
        },
        {
          model: InstallationAmount,
          as: 'installationAmount',
          attributes: ['amount'],
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name'],
        },
        {
          model: SaleStatus,
          as: 'saleStatus',
          attributes: ['status_name'],
        },
        {
          model: SaleStatusReason,
          as: 'reason',
          attributes: ['reason_name'],
        },      
        {
          model: User,
          as: 'executive',
          attributes: [
            'first_name',
            'second_name',
            'last_name',
            'second_last_name',
            'rut',
            'email',
            'phone_number',
          ],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['role_name'],
            },
          ],
        },
      ],
    };

    const sale = await Sales.findOne(options);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    const idCardImagePaths = sale.id_card_image.split(',');
    const idCardImages = idCardImagePaths.map((path) => {
      return {
        url: `${req.protocol}://${req.get('host')}${path}`,
        label: path.split('/').pop(),
      };
    });

    sale.id_card_image_links = idCardImages;

    res.json(sale);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error obteniendo venta', error: error.message });
  }
};



export const getPromotionsByCommune = async (req, res) => {
  const communeId = req.params.commune_id;

  try {
    const promotions = await fetchPromotionsByCommune(communeId);
    const activePromotions = promotions.filter(promotion => promotion.is_active === 1);
    res.json(activePromotions);
  } catch (error) {
    handleError(res, 'Error obteniendo promociones', error);
  }
};
const fetchPromotionsByCommune = async (communeId) => {
  return await Promotion.findAll({
    where: { is_active: 1 },
    include: [
      {
        model: PromotionCommune,
        where: { commune_id: communeId, is_active: 1 },
      },
    ],
  });
};

export const getInstallationAmountsByPromotion = async (req, res) => {
  const promotionId = req.params.promotion_id;

  try {
    const installationAmount = await fetchInstallationAmountByPromotion(promotionId);
    res.json(installationAmount);
  } catch (error) {
    handleError(res, 'Error obteniendo monto de instalación', error);
  }
};

const fetchInstallationAmountByPromotion = async (promotionId) => {
  const promotion = await Promotion.findByPk(promotionId);
  if (!promotion) {
    throw new Error('Promoción no encontrada');
  }

  const installationAmount = await InstallationAmount.findByPk(promotion.installation_amount_id);
  if (!installationAmount) {
    throw new Error('Monto de instalación no encontrado');
  }

  return { installation_amount_id: installationAmount.installation_amount_id, amount: installationAmount.amount };
};

const handleError = (res, message, error) => {
  console.error('Error details:', error);
  res.status(500).json({ message, error: error.message });
};

export const getSalesBySearch = async (req, res) => {
  const searchTerm = req.query.search;
  const userId = req.user.user_id;
  const userRoleId = req.user.role_id;

  if (!searchTerm) {
    return res.status(400).json({ message: 'El término de búsqueda no puede estar vacío' });
  }

  try {
    const whereClause = buildWhereClause(searchTerm, userId, userRoleId);

    const sales = await Sales.findAll({
      where: whereClause,
      attributes: [
        'sale_id',
        'service_id',
        'entry_date',
        'client_first_name',
        'client_last_name',
        'client_rut',
        'client_email',
        'client_phone',
        'client_secondary_phone',
        'street',
        'number',
        'department_office_floor',
        'geo_reference',
        'additional_comments',
        'id_card_image',
        'created_at'
      ],
      include: [
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['channel_name'],
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['promotion'], // Revisa que este atributo coincida con el nombre correcto en la tabla de promociones
        },
        {
          model: Region,
          as: 'region',
          attributes: ['region_name'],
        },
        {
          model: Commune,
          as: 'commune',
          attributes: ['commune_name'],
        },
        {
          model: InstallationAmount,
          as: 'installationAmount',
          attributes: ['amount'],
        },
        {
          model: SaleStatus,
          as: 'saleStatus',
          attributes: ['status_name'],
        },
        {
          model: SaleStatusReason,
          as: 'reason',
          attributes: ['reason_name'],
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name'],
        },
      ],
      order: [['created_at','DESC']],
    });

    if (sales.length === 0) {
      return res.status(404).json({ message: 'No se encontró ninguna venta que coincida con la búsqueda' });
    }

    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas por búsqueda:', error);
    return res.status(500).json({ message: 'Error al obtener ventas por búsqueda', error: error.message });
  }
};

const buildWhereClause = (searchTerm, userId, userRoleId) => {
  const conditions = {
    [Op.and]: [],
    [Op.or]: [
      { client_first_name: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
      { client_last_name: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
      { client_rut: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
      { client_email: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
      { client_phone: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
      { street: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
      { service_id: { [Op.like]: `%${searchTerm.toLowerCase()}%` } },
    ],
  };

  // Condiciones según el role_id
  if (userRoleId === 1 || userRoleId === 4) {
    // roles 1(SuperAdmin) y 4(Valid) pueden buscar libremente
    return conditions;
  } else if (userRoleId === 2) {
    // rol 2(Admin): buscar por company_id asociado
    conditions[Op.and].push({ company_id: userId });
  } else if (userRoleId === 3) {
    // rol 3(Ejec): buscar solo por executive_id y sale_status_id 1 o 4
    conditions[Op.and].push({ executive_id: userId });
    conditions[Op.and].push({ 
      [Op.or]: [{ sale_status_id: 1 }, { sale_status_id: 4 }] 
    });
  } else if (userRoleId === 4) {
    // rol 4(Despachador): buscar solo por sale_status_id 2, 5 o 6
    conditions[Op.and].push({ 
      [Op.or]: [{ sale_status_id: 2 }, { sale_status_id: 5 }, { sale_status_id: 6 }] 
    });
  }

  return conditions;
};

export const updateSale = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const roleId = req.user.role_id;
    const saleId = req.params.sale_id;

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
      sale_status_id,
      sale_status_reason_id
    } = req.body;

    const sale = await Sales.findByPk(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Verifica permisos para actualizar
    if (!await canUpdateSale(roleId, sale_status_id, userId, saleId)) {
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

    // Agregamos la lógica para actualizar el motivo de rechazo
    if (roleId !== 3) {
      updatedSaleData.sale_status_reason_id = sale_status_reason_id;
    }

    if (roleId === 5 && [5, 6, 7].includes(sale_status_id)) {
      updatedSaleData.dispatcher_id = userId;
    }

    await sale.update(updatedSaleData);

    res.status(200).json({ message: 'Venta actualizada con éxito', sale });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error al actualizar la venta', error: error.message });
  }
};

const canUpdateSale = async (roleId, saleStatusId, userId, saleId, companyId) => {
  if (roleId === 1) {
    return true; // Rol 1 puede actualizar el saleStatusId a cualquiera
  }

  if (roleId === 2) {
    const sale = await Sales.findByPk(saleId);
    return sale.company_id === companyId; // Rol 2 puede actualizar solo si la venta es de su company_id
  }

  if (saleStatusId === 7) {
    return true; // Ventas con saleStatusId en 7 pueden ser actualizadas
  }

  switch (saleStatusId) {
    case 1:
      return roleId === 4; // Rol 4 es Validador
    case 2:
      return roleId === 5; // Rol 5 es Despachador
    case 3:
      return roleId === 4; // Rol 4 es Validador
    case 4:
      const sale = await Sales.findByPk(saleId);
      return roleId === 3 && sale.executive_id === userId; // Rol 3 es Ejecutivo
    case 5:
      return roleId === 5; // Rol 5 es Despachador
    case 6:
      return roleId === 5; // Rol 5 es Despachador
    default:
      return false;
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
  updateSale,
  updateSaleByExecutive,
};