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

const validateInputs = async (reqBody) => {
  const { region_id, commune_id, promotion_id, sale_status_id, sale_status_reason_id } = reqBody;

  const numericSaleStatusId = Number(sale_status_id);

  if (isNaN(numericSaleStatusId)) {
    throw new Error('sale_status_id debe ser un número válido');
  }

  // Validación para sale_status_id y sale_status_reason_id
  if (numericSaleStatusId !== 1) {
    if (!sale_status_reason_id) {
      throw new Error('El motivo de estado de venta es requerido para estados de venta diferentes a 1');
    }
    const saleStatusReason = await SaleStatusReason.findOne({
      where: {
        sale_status_id: numericSaleStatusId,
        sale_status_reason_id,
      },
    });
    if (!saleStatusReason) {
      throw new Error('El motivo de estado de venta no está asociado al estado de venta');
    }
  } else if (sale_status_reason_id !== null && sale_status_reason_id !== undefined) {
    throw new Error('No se debe proporcionar un motivo de estado de venta para el estado 1');
  }

  // Resto de las validaciones...
  const promotion = await Promotion.findOne({
    where: {
      promotion_id: promotion_id,
    },
  });

  if (!promotion) {
    throw new Error('Promoción no encontrada');
  }

  const installationAmountId = promotion.installation_amount_id;

  const installationAmount = await InstallationAmount.findByPk(installationAmountId);
  if (!installationAmount) {
    throw new Error('Monto de instalación no encontrado');
  }

  const saleStatus = await SaleStatus.findOne({
    where: {
      sale_status_id: numericSaleStatusId,
    },
  });
  if (!saleStatus) {
    throw new Error('Estado de venta no encontrado');
  }

  const region = await fetchRegionById(region_id);
  if (!region) {
    throw new Error('Región no encontrada');
  }

  const commune = await Commune.findOne({
    where: {
      commune_id: commune_id,
    },
  });
  if (!commune) {
    throw new Error('Comuna no encontrada');
  }

  return { promotion, installationAmountId };
};

export const createSale = async (req, res) => {
  try {
    // Normalize the request body
    const reqBody = Object.keys(req.body).reduce((acc, key) => {
      acc[key.trim()] = req.body[key];
      return acc;
    }, {});

    const files = req.files;
    if (!req.files || !req.files.other_images) {
      return res.status(400).json({ message: 'No files provided' });
    }

    // Handle file renaming for each image type
    const otherImages = handleFileRenaming(files.other_images, reqBody.client_rut);

    // Validate inputs
    const { promotion, installationAmountId } = await validateInputs(reqBody);
    
    // Get current user information
    // Get current user information
    const currentUser = await User.findByPk(req.user.user_id, {
      include: [
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['sales_channel_id'],
        },
      ],
    });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get company priority
    const companyPriority = await CompanyPriority.findOne({ 
      where: { company_id: currentUser.company_id }, 
      order: [['priority_level', 'ASC']] 
    });
    if (!companyPriority) {
      return res.status(404).json({ message: 'Company priority not found' });
    }

    // Check for existing RUT and email
    const existingRut = await Sales.findOne({ where: { client_rut: reqBody.client_rut } });
    if (existingRut) {
      return res.status(400).json({ message: 'RUT already exists in the database' });
    }

    const existingEmail = await Sales.findOne({ where: { client_email: reqBody.client_email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists in the database' });
    }

    // Create sale data
    const saleData = createSaleData(reqBody, otherImages, currentUser, promotion.installation_amount_id, companyPriority.priority_level);
    const sale = await Sales.create(saleData);

    // Send email notification if the sale is in initial status
    if (saleData.sale_status_id === 1) {
      await sendEmailNotification(sale, currentUser, reqBody);
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

const handleFileRenaming = (files, clientRut) => {
  // Asegurarse de que los archivos estén en un array
  if (!Array.isArray(files)) {
    files = [files]; // Convierte a array si es un solo archivo
  }

  if (!files || files.length === 0) {
    return []; // Retorna vacío si no hay archivos
  }

  try {
    // Mapea los archivos y genera nuevos nombres para cada uno
    const newFiles = files.map((file) => {
      const ext = path.extname(file.originalname); // Obtiene la extensión del archivo
      const newFileName = `${clientRut}_${Date.now()}${ext}`; // Crea un nuevo nombre con timestamp
      const filePath = path.posix.join('uploads', newFileName); // Define la ruta completa

      // Renombra el archivo y lo mueve a la carpeta de 'uploads'
      fs.renameSync(file.path, filePath);

      // Normaliza la ruta del archivo para compatibilidad multiplataforma
      const normalizedFilePath = filePath.replace(/\\/g, '/');

      return normalizedFilePath;
    });

    return newFiles; // Retorna el array de rutas de los archivos renombrados
  } catch (error) {
    console.error(`Error al subir archivos: ${error}`);
    return [];
  }
};


const createSaleData = (reqBody, otherImages, currentUser, installationAmountId, companyPriorityId) => {
  const { service_id, client_first_name, client_last_name, client_rut, client_email, client_phone, client_secondary_phone, region_id, commune_id, street, number, department_office_floor, geo_reference, promotion_id, additional_comments } = reqBody;

  return {
    service_id: service_id || null,
    sales_channel_id: currentUser.salesChannel.sales_channel_id,
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
    other_images: otherImages.length > 0 ? otherImages.join(',') : null,
    is_priority: 0,
    priority_modified_by_user_id: null,
    sale_status_id: 1, // Asegúrate de que siempre es 1
    sale_status_reason_id: null, // Asegúrate de que siempre es null
    superadmin_id: currentUser.role_id === 1 ? currentUser.user_id : null,
    admin_id: currentUser.role_id === 2 ? currentUser.user_id : null,
    executive_id: currentUser.role_id === 3 ? currentUser.user_id : null,
    validator_id: null,
    dispatcher_id: null,
    company_id: currentUser.company_id,
    company_priority_id: companyPriorityId,
    modified_by_user_id: currentUser.user_id,
  };
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
          attributes: ['installation_amount_id','amount'],
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
            {
              model: SalesChannel,
              as: 'salesChannel',
              attributes: ['channel_name'],
            },
            {
              model: Company,
              as: 'company',
              attributes: ['company_name'],
            },
          ],
        },
      ],
      attributes: [
        'service_id',
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
        'other_images',
        'is_priority',
        'sale_status_id',
        'sale_status_reason_id',
        'company_id',
        'company_priority_id',
        'created_at',
      ],
    };

    const sale = await Sales.findOne(options);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Función para procesar las rutas de imágenes
    const processImagePaths = (imagePath) => {
      if (!imagePath) return null;
      const imagePaths = imagePath.split(',');
      const processedPaths = imagePaths.map((path) => {
        const cleanedPath = path.replace(/\\/g, '/').replace(/"/g, '');
        return `${req.protocol}://${req.get('host')}/${cleanedPath}`;
      });
      return processedPaths;
    };

    // Aplicar la normalización a las rutas de imágenes
    sale.dataValues.other_images_url = processImagePaths(sale.other_images);

    // Enviar la respuesta con las URLs normalizadas
    res.json(sale);
  } catch (error) {
    console.error('Error al obtener la venta:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
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
          attributes: ['promotion'],
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
    const userCompanyId = req.user.company_id;

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
      installation_amount_id,
      additional_comments,
      is_priority,
      sale_status_id,
      sale_status_reason_id,
      company_id,
      existing_images
    } = req.body;

    const sale = await Sales.findByPk(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    let saleDataToUpdate = {};

    if (sale_status_id === 1) {
      const saleStatusReason = await SaleStatusReason.findOne({
        where: {
          reason_name: 'Ingresada',
        },
      });
      if (saleStatusReason) {
        saleDataToUpdate.sale_status_reason_id = saleStatusReason.sale_status_reason_id;
      } else {
        saleDataToUpdate.sale_status_reason_id = 0; // o un valor especial que indique que no hay un motivo de estado de venta válido
      }
    } else {
      if (!sale_status_reason_id) {
        throw new Error('El motivo de estado de venta es requerido');
      }
      saleDataToUpdate.sale_status_reason_id = sale_status_reason_id;
    }

    // Obtener las imágenes existentes
    let existingImagesArray = existing_images && typeof existing_images === 'string' ? existing_images.split(',') : [];

    // Procesar las nuevas imágenes
    const newImages = req.files?.other_images || [];

    // Verificar el número total de imágenes
    if (existingImagesArray.length + newImages.length > 5) {
      return res.status(400).json({ message: 'No se pueden subir más de 5 imágenes en total' });
    }

    // Obtener las rutas de las nuevas imágenes
    const newImagePaths = newImages.map(file => file.path);

    // Combinar imágenes existentes y nuevas
    const allImages = [...existingImagesArray, ...newImagePaths];

    // Crear el objeto updatedSaleData
    let updatedSaleData = {
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
      installation_amount_id,
      additional_comments,
      is_priority,
      sale_status_id,
      sale_status_reason_id,
      company_id,
      other_images: allImages.join(',')
    };

    // Verificar permisos basados en el rol
    if (roleId !== 1 && sale.company_id !== userCompanyId) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar esta venta' });
    }

    let allowedFields = [];
    let allowedSaleStatuses = [];

    switch (roleId) {
      case 1: // SuperAdmin
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'company_id', 'other_images'];
        allowedSaleStatuses = [1, 2, 3, 4, 5, 6, 7];
        break;
      case 2: // Administrador
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'other_images'];
        allowedSaleStatuses = [1, 2, 3, 4, 5, 6, 7];
        break;
      case 3: // Ejecutivo
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'other_images', 'existing_images'];
        allowedSaleStatuses = [1];
        break;
      case 4: // Validador
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'other_images'];
        allowedSaleStatuses = [2, 3, 4, 7];
        break;
      case 5: // Despachador
        allowedFields = ['sale_status_id', 'sale_status_reason_id'];
        allowedSaleStatuses = [5, 6, 7];
        break;
      default:
        return res.status(403).json({ message: 'No tienes permisos para actualizar ventas' });
    }

    // Verificar si el nuevo estado de venta está permitido para este rol
    if (sale_status_id && !allowedSaleStatuses.includes(Number(sale_status_id))) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar la venta a este estado' });
    }

    // Filtrar y asignar solo los campos permitidos
    let filteredUpdatedSaleData = {};
    allowedFields.forEach(field => {
      if (updatedSaleData[field] !== undefined) {
        filteredUpdatedSaleData[field] = updatedSaleData[field];
      }
    });

    // Validaciones adicionales
    if (filteredUpdatedSaleData.client_email && filteredUpdatedSaleData.client_email !== sale.client_email) {
      const existingEmail = await Sales.findOne({ where: { client_email: filteredUpdatedSaleData.client_email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya existe en la base de datos' });
      }
    }

    if (filteredUpdatedSaleData.client_rut && filteredUpdatedSaleData.client_rut !== sale.client_rut) {
      const existingRut = await Sales.findOne({ where: { client_rut: filteredUpdatedSaleData.client_rut } });
      if (existingRut) {
        return res.status(400).json({ message: 'El RUT ya existe en la base de datos' });
      }
    }

    // Actualizar campos específicos basados en el rol
    filteredUpdatedSaleData.modified_by_user_id = userId;
    if (roleId === 1) filteredUpdatedSaleData.superadmin_id = userId;
    if (roleId === 2) filteredUpdatedSaleData.admin_id = userId;
    if ([2, 3, 4, 7].includes(Number(sale_status_id))) filteredUpdatedSaleData.validator_id = userId;
    if ([5, 6, 7].includes(Number(sale_status_id))) filteredUpdatedSaleData.dispatcher_id = userId;

    // Actualizar la venta
    await sale.update(filteredUpdatedSaleData);

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
  updateSale
};