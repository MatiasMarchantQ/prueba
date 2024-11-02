import Sales from '../models/Sales.js';
import SaleHistory from '../models/SaleHistories.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import User from '../models/Users.js';
import Role from '../models/Roles.js';
import SalesChannel from '../models/SalesChannels.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import Company from '../models/Companies.js';
import SaleStatus from '../models/SaleStatuses.js';
import SaleStatusReason from '../models/SaleStatusReason.js';
import Contract from '../models/Contract.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fetchRegionById } from '../services/dataServices.js';
import { exportSales } from '../controllers/exportController.js';
import { Op, Sequelize } from 'sequelize';
import { sendEmailNotification, sendActiveSaleEmailNotification } from '../services/emailService.js';

const getLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const newFileName = `${req.body.client_rut}_${Date.now()}${ext}`;
    cb(null, newFileName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')|| file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/msword') {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB
}).fields([{ name: 'other_images', maxCount: 5 }]);

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
    throw new Error('No se debe proporcionar un motivo de estado de venta para el estado Ingresado');
  }

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
    const reqBody = Object.keys(req.body).reduce((acc, key) => {
      acc[key.trim()] = req.body[key];
      return acc;
    }, {});

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
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const existingRut = await Sales.findOne({ where: { client_rut: reqBody.client_rut } });
    if (existingRut) {
      return res.status(400).json({ message: 'El RUT ya existe en la base de datos' });
    }

    if (reqBody.client_email && reqBody.client_email.trim() !== '') {
      const existingEmail = await Sales.findOne({ where: { client_email: reqBody.client_email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya existe en la base de datos' });
      }
    }

    const otherImages = req.body.other_images ? req.body.other_images.split(',') : req.files && req.files.other_images ? req.files.other_images.map(file => file.path) : null;

    const saleData = {
      service_id: reqBody.service_id || null,
      sales_channel_id: currentUser.salesChannel.sales_channel_id,
      client_first_name: reqBody.client_first_name,
      client_last_name: reqBody.client_last_name,
      client_rut: reqBody.client_rut,
      client_email: reqBody.client_email || null,
      client_phone: reqBody.client_phone,
      client_secondary_phone: reqBody.client_secondary_phone || null,
      region_id: reqBody.region_id,
      commune_id: reqBody.commune_id,
      street: reqBody.street || null,
      number: reqBody.number || null,
      department_office_floor: reqBody.department_office_floor || null,
      geo_reference: reqBody.geo_reference,
      promotion_id: reqBody.promotion_id,
      installation_amount_id: reqBody.installation_amount_id,
      additional_comments: reqBody.additional_comments || null,
      other_images: otherImages.length > 0 ? otherImages.join(',') : null,
      is_priority: 0,
      priority_modified_by_user_id: null,
      sale_status_id: 1, // Siempre es 1
      sale_status_reason_id: null, // Siempre es null
      superadmin_id: currentUser.role_id === 1 ? currentUser.user_id : null,
      admin_id: currentUser.role_id === 2 ? currentUser.user_id : null,
      executive_id: currentUser.role_id === 3 ? currentUser.user_id : null,
      validator_id: null,
      dispatcher_id: null,
      company_id: currentUser.company_id,
      modified_by_user_id: currentUser.user_id,
      created_at: getLocalDateTime(),
    };

    const sale = await Sales.create(saleData);

    // Send email notification if the sale is in initial status
    if (saleData.sale_status_id === 1) {
      await sendEmailNotification(sale, currentUser, reqBody);
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error('Detalles de error:', error);
    res.status(500).json({ message: 'Error creando venta', error: error.message });
  }
};


export const getSaleHistory = async (req, res) => {
  try {
    const { sale_id } = req.params;

    // Obtener la venta
    const sale = await Sales.findByPk(sale_id);

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Obtener el historial de la venta
    const saleHistory = await SaleHistory.findAll({
      where: { sale_id },
      include: [
        {
          model: User,
          as: 'modifiedByUser',
          attributes: ['first_name', 'last_name'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['role_name'],
            },
          ],
        },
        {
          model: User,
          as: 'priorityModifiedByUser',
          attributes: ['first_name', 'last_name'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['role_name'],
            },
          ],
        },
        {
          model: SaleStatus,
          as: 'newStatus',
          attributes: ['status_name'],
        },
        {
          model: SaleStatus,
          as: 'previousStatus',
          attributes: ['status_name'],
        },
        {
          model: SaleStatusReason,
          as: 'reason',
          attributes: ['reason_name'],
        },
      ],
      order: [['history_id', 'ASC']],
    });

    // Procesar el historial para obtener la información requerida
    const processedHistory = saleHistory.map(history => {
      let eventType = 'Actualización';
      if (history.date_type) {
        eventType = history.date_type;
      } else if (history.previous_status_id === null && history.new_status_id === 1) {
        eventType = 'Ingresado';
      }
      
      return {
        eventType,
        date: history.modification_date || history.date,
        user: history.modifiedByUser ? `${history.modifiedByUser.first_name} ${history.modifiedByUser.last_name} (${history.modifiedByUser.role.role_name})` : null,
        previousStatus: history.previousStatus ? history.previousStatus.status_name : null,
        newStatus: history.newStatus ? history.newStatus.status_name : null,
        reason: history.reason ? history.reason.reason_name : null,
        isPriority: history.is_priority === 1,
        priorityModifiedBy: history.priorityModifiedByUser ? `${history.priorityModifiedByUser.first_name} ${history.priorityModifiedByUser.last_name} (${history.priorityModifiedByUser.role.role_name})` : null,
        additional_comments: history.additional_comments
      };
    });

    res.json({
      sale_id: sale.sale_id,
      client_name: `${sale.client_first_name} ${sale.client_last_name}`,
      client_rut: sale.client_rut,
      history: processedHistory,
    });

  } catch (error) {
    console.error('Error al obtener el historial de la venta:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const getSalesData = async (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const offset = (page - 1) * limit;

  const { company_id: companyId, role_id: roleId, user_id: userId } = req.user;

  try {
    const where = buildWhereConditions(roleId, companyId, userId);
    const { filters, order: filterOrder } = buildFilterConditions(req.query);
    Object.assign(where, filters);

    const defaultOrder = await buildOrderConditions(companyId, roleId);
    const order = filterOrder.length > 0 ? filterOrder.concat(defaultOrder) : defaultOrder;
    
    const sales = await Sales.findAll({
      limit,
      offset,
      where,
      include: getSalesIncludes(),
      order,
    });

    const totalSales = await getTotalSalesCount(where);
    const totalPages = Math.ceil(totalSales / limit);

    return { sales, totalPages, currentPage: page };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAllSales = async (req) => {
  const { company_id: companyId, role_id: roleId, user_id: userId } = req.user;

  try {
    const where = buildWhereConditions(roleId, companyId, userId);
    const { filters } = buildFilterConditions(req.query);
    Object.assign(where, filters);

    let order = [];
    if (req.query.sortField && req.query.sortOrder) {
      const validSortFields = [
        'created_at', 'sale_id', 'service_id', 'client_first_name', 'client_last_name',
        'client_rut', 'region_id', 'commune_id', 'promotion_id', 'sale_status_reason_id', 'company_id'
      ];
      if (validSortFields.includes(req.query.sortField)) {
        const sortOrder = req.query.sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        order.push([req.query.sortField, sortOrder]);
      }
    }

    // Añadir el orden por defecto después del orden especificado por el usuario
    const defaultOrder = await buildOrderConditions(roleId);
    order = order.concat(defaultOrder);

    const sales = await Sales.findAll({
      where,
      include: [
        ...getSalesIncludes(),
        {
          model: Company,
          as: 'company',
          attributes: ['priority_level'],
        },
      ],
      order: order,
    });

    return sales;
  } catch (error) {
    console.error('Error en getAllSales:', error);
    throw error;
  }
};

export const getSales = async (req, res) => {
  try {
    if (req.query.export === 'true') {
      // Obtenemos las ventas aplicando el mismo orden que en la visualización
      const sales = await getAllSales(req);

      const salesExport = sales.map(sale => {
        const date = new Date(sale.created_at);
        const createdAt = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;

        return {
          sale_id: sale.sale_id,
          service_id: sale.service_id,
          client_first_name: sale.client_first_name,
          client_last_name: sale.client_last_name,
          client_rut: sale.client_rut,
          client_email: sale.client_email,
          client_phone: sale.client_phone,
          client_secondary_phone: sale.client_secondary_phone,
          region: sale.region.region_name,
          commune: sale.commune.commune_name,
          street: sale.street,
          number: sale.number,
          department_office_floor: sale.department_office_floor,
          geo_reference: sale.geo_reference,
          promotion: sale.promotion.promotion,
          installationAmount: sale.installationAmount.amount,
          additional_comments: sale.additional_comments,
          is_priority: sale.is_priority,
          saleStatus: sale.saleStatus.status_name,
          reason: sale.reason ? sale.reason.reason_name : '',
          company: sale.company.company_name,
          created_at: createdAt
        };
      });

      const format = req.query.format;
      await exportSales(salesExport, format, res);
    } else {
      const data = await getSalesData(req);
      res.json(data);
    }
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ message: 'Error obteniendo ventas' });
  }
};

const buildFilterConditions = (query) => {
  const filters = {};
  const order = [];

  if (query.sales_channel_id) filters.sales_channel_id = query.sales_channel_id;
  if (query.region_id) filters.region_id = query.region_id;
  if (query.commune_id) filters.commune_id = query.commune_id;
  if (query.is_priority) filters.is_priority = query.is_priority;
  if (query.promotion_id) filters.promotion_id = query.promotion_id;
  if (query.installation_amount_id) filters.installation_amount_id = query.installation_amount_id;
  if (query.sale_status_id) filters.sale_status_id = query.sale_status_id;
  if (query.sale_status_reason_id) filters.sale_status_reason_id = query.sale_status_reason_id;
  if (query.company_id) filters.company_id = query.company_id;
  if (query.start_date) {
    const startDateFormatted = query.start_date;
    if (query.end_date) {
      const endDateFormatted = query.end_date;
      filters.created_at = {
        [Op.between]: [new Date(startDateFormatted), new Date(endDateFormatted)]
      };
    } else {
      filters.created_at = {
        [Op.gte]: new Date(startDateFormatted)
      };
    }
  } else if (query.end_date) {
    const endDateFormatted = query.end_date;
    filters.created_at = {
      [Op.lte]: new Date(endDateFormatted)
    };
  }

  if (query.role_id) {
    filters['$executive.role.role_id$'] = query.role_id;
  }
  if (query.superadmin_id) {
    filters['$superadmin.role.role_id$'] = query.superadmin_id;
  }
  if (query.admin_id) {
    filters['$admin.role.role_id$'] = query.admin_id;
  }
  if (query.validator_id) {
    filters['$validator.role.role_id$'] = query.validator_id;
  }
  if (query.dispatcher_id) {
    filters['$dispatcher.role.role_id$'] = query.dispatcher_id;
  }

  if (query.sortField && query.sortOrder) {
    const validSortFields = [
      'created_at', 'sale_id', 'service_id', 'client_first_name', 'client_last_name',
      'client_rut', 'region_id', 'commune_id', 'promotion_id', 'sale_status_reason_id', 'company_id'
    ];

    if (validSortFields.includes(query.sortField)) {
      const sortOrder = query.sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      order.push([query.sortField, sortOrder]);
    }
  }

  return { filters, order };
};

const buildWhereConditions = (roleId, companyId, userId) => {
  const where = {};

  if (roleId === 2) {
    where.company_id = companyId;
  } else if (roleId === 3) {
    where.executive_id = userId;  
  } else if (roleId === 4) {
    where.sale_status_id = [1, 3];
  } else if (roleId === 5) {
    where.sale_status_id = [2, 5, 6];
  }

  return where;
};

export const buildOrderConditions = async (roleId, sortField, sortOrder, filters) => {
  let order = [];

  // Definir campos de ordenamiento permitidos
  const allowedSortFields = [
    'created_at', 'sale_id', 'service_id', 'client_first_name', 'client_last_name',
    'client_rut', 'region_id', 'commune_id', 'promotion_id', 'sale_status_reason_id', 'company_id'
  ];

  // Si se proporciona un campo de ordenamiento válido, añadirlo al principio del array de orden
  if (sortField && sortOrder && allowedSortFields.includes(sortField)) {
    order.push([sortField, sortOrder.toUpperCase()]);
  }

  // Añadir condiciones de ordenamiento adicionales
  order = order.concat([
    [Sequelize.literal('CASE WHEN is_priority = 1 THEN 0 ELSE 1 END'), 'ASC'],
    [Sequelize.literal('CASE WHEN `Sales`.sale_status_id IN (1, 2) THEN 0 ELSE 1 END'), 'ASC'],
    [{ model: Company, as: 'company' }, 'priority_level', 'ASC'],
    ['sale_id', 'DESC']
  ]);

  // Añadir ordenamiento específico por rol
  switch (roleId) {
    case 3: // Ejecutivo
      order.push([Sequelize.literal('CASE WHEN `Sales`.sale_status_id = 4 THEN 0 WHEN `Sales`.sale_status_id = 1 THEN 1 ELSE 2 END'), 'ASC']);
      break;
    case 4: // Admin
      order.push([Sequelize.literal('CASE WHEN `Sales`.sale_status_id = 1 THEN 0 WHEN `Sales`.sale_status_id = 3 THEN 1 ELSE 2 END'), 'ASC']);
      break;
    case 5: // Validador
      order.push([Sequelize.literal('CASE WHEN `Sales`.sale_status_id = 2 THEN 0 WHEN `Sales`.sale_status_id = 5 THEN 1 WHEN `Sales`.sale_status_id = 6 THEN 2 ELSE 3 END'), 'ASC']);
      break;
    default:
      order.push([{ model: SaleStatus, as: 'saleStatus' }, 'sale_status_id', 'ASC']);
      break;
  }

  // Añadir ordenamiento según los filtros
  if (filters) {
    Object.keys(filters).forEach((key) => {
      order.push([key, 'ASC']);
    });
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
      'last_name',
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
  {
    model: User,
    as: 'validator',
    attributes: [
      'first_name',
      'last_name',
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
  {
    model: User,
    as: 'dispatcher',
    attributes: [
      'first_name',
      'last_name',
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
  {
    model: User,
    as: 'superadmin',
    attributes: [
      'first_name',
      'last_name',
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
  {
    model: User,
    as: 'admin',
    attributes: [
      'first_name',
      'last_name',
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
            'last_name',
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
            {
              model: Contract,
              as: 'contract',
              attributes: ['contract_name'],
            },
          ],
        },
        {
          model: User,
          as: 'superadmin',
          attributes: [
            'first_name',
            'last_name',
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
        {
          model: User,
          as: 'admin',
          attributes: [
            'first_name',
            'last_name',
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
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        return `${protocol}://${req.get('host')}/${cleanedPath}`;
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
        'is_priority',
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
        saleDataToUpdate.sale_status_reason_id = 0;
      }
    } else {
      if (!sale_status_reason_id) {
        return error({ message: 'El motivo de estado de venta es requerido' });
      }

      const saleStatusReason = await SaleStatusReason.findOne({
        where: {
          sale_status_id: sale_status_id,
          sale_status_reason_id: sale_status_reason_id,
        },
      });
      
      if (!saleStatusReason) {
        return res.status(400).json({ message: 'El motivo de estado de venta no está asociado al estado de venta' });
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
      other_images: allImages.join(',') || null
    };

    let allowedFields = [];
    let allowedSaleStatuses = [];

    switch (roleId) {
      case 1: // SuperAdmin
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'company_id', 'other_images', 'existing_images'];
        allowedSaleStatuses = [1, 2, 3, 4, 5, 6, 7];
        break;
      case 2: // Administrador
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'other_images', 'existing_images'];
        allowedSaleStatuses = [1, 2, 3, 4, 5, 6, 7];
        break;
      case 3: // Ejecutivo
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'other_images', 'existing_images'];
        allowedSaleStatuses = [1];
        break;
      case 4: // Validador
        allowedFields = ['service_id', 'client_first_name', 'client_last_name', 'client_rut', 'client_email', 'client_phone', 'client_secondary_phone', 'region_id', 'commune_id', 'street', 'number', 'department_office_floor', 'geo_reference', 'promotion_id', 'installation_amount_id', 'additional_comments', 'is_priority', 'sale_status_id', 'sale_status_reason_id', 'other_images', 'existing_images'];
        allowedSaleStatuses = [2, 3, 4, 7];
        break;
      case 5: // Despachador
        allowedFields = ['service_id', 'sale_status_id', 'sale_status_reason_id', 'additional_comments'];
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
    if (filteredUpdatedSaleData.service_id && filteredUpdatedSaleData.service_id !== sale.service_id) {
      const existingService = await Sales.findOne({ 
        where: { 
          service_id: filteredUpdatedSaleData.service_id,
          sale_id: { [Op.ne]: saleId }
        } 
      });
      if (existingService) {
        return res.status(400).json({ message: 'El ID de servicio ya existe' });
      }
    }

    if (filteredUpdatedSaleData.client_email && filteredUpdatedSaleData.client_email !== sale.client_email && filteredUpdatedSaleData.client_email.trim() !== '') {
      const existingEmail = await Sales.findOne({ where: { client_email: filteredUpdatedSaleData.client_email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya existe' });
      }
    }

    if (filteredUpdatedSaleData.client_rut && filteredUpdatedSaleData.client_rut !== sale.client_rut) {
      const existingRut = await Sales.findOne({ where: { client_rut: filteredUpdatedSaleData.client_rut } });
      if (existingRut) {
        return res.status(400).json({ message: 'El RUT ya existe' });
      }
    }

    // Actualizar campos específicos basados en el rol
    filteredUpdatedSaleData.modified_by_user_id = userId;
    if (roleId === 1) filteredUpdatedSaleData.superadmin_id = userId;
    if (roleId === 2) filteredUpdatedSaleData.admin_id = userId;
    if ([2, 3, 4, 7].includes(Number(sale_status_id))) filteredUpdatedSaleData.validator_id = userId;
    if ([5, 6, 7].includes(Number(sale_status_id))) filteredUpdatedSaleData.dispatcher_id = userId;

    // Guardar el estado anterior de la venta
    const oldSaleStatus = sale.sale_status_id;
    const oldSaleStatusReason = sale.sale_status_reason_id;

    // Actualizar la venta
    await sale.update(filteredUpdatedSaleData);

    // Verificar si el campo other_images está vacío
    if (filteredUpdatedSaleData.other_images === '') {
      await sale.update({ other_images: null });
    }

    // Obtener el último registro del historial
    const lastHistoryRecord = await SaleHistory.findOne({
      where: { sale_id: saleId },
      order: [['modification_date', 'DESC']],
    });

    // Determinar si se debe registrar el comentario
    let commentToSave = null;
    if (additional_comments) {
      // Solo guardar el comentario si:
      // 1. No hay registro previo, o
      // 2. El comentario actual es diferente al último comentario registrado
      if (!lastHistoryRecord || lastHistoryRecord.additional_comments !== additional_comments) {
        commentToSave = additional_comments;
      }
    }

    // Insertar registro en SaleHistory si se actualizó el estado de la venta
    if (oldSaleStatus !== filteredUpdatedSaleData.sale_status_id) {
      let dateType = 'Actualizado';
      
      // Set specific date_type based on the new sale_status_id
      switch (Number(filteredUpdatedSaleData.sale_status_id)) {
        case 2:
          dateType = 'Validado';
          break;
        case 6:
          dateType = 'Activo';
          break;
        case 7:
          dateType = 'Anulado';
          break;
      }

      // Crear un solo registro en SaleHistory
      await SaleHistory.create({
        sale_id: saleId,
        previous_status_id: oldSaleStatus,
        new_status_id: filteredUpdatedSaleData.sale_status_id,
        sale_status_reason_id: filteredUpdatedSaleData.sale_status_reason_id,
        modified_by_user_id: userId,
        modification_date: getLocalDateTime(),
        date_type: dateType,
        date: getLocalDate(),
        additional_comments: commentToSave
      });
    }
    // Enviar correo si el estado de la venta se actualiza a 6
    if (Number(filteredUpdatedSaleData.sale_status_id) === 6) {
      // Obtener el historial de la venta para encontrar quién la ingresó
      const saleHistory = await SaleHistory.findOne({
        where: {
          sale_id: sale.sale_id,
          new_status_id: 1, // Solo buscamos la entrada donde se ingresó la venta
          previous_status_id: null // Esto ayuda a identificar la entrada inicial
        },
        order: [['modification_date', 'ASC']], // Asegúrate de obtener el primer registro
      });

      if (saleHistory) {
        const userId = saleHistory.modified_by_user_id;
      
        // Obtener el usuario que ingresó la venta
        const saleCreator = await User.findByPk(userId);
        if (saleCreator && saleCreator.email) {
          try {
            await sendActiveSaleEmailNotification(sale, saleCreator, req.body);
          } catch (emailError) {
            console.error(`Error al enviar el correo a ${saleCreator.first_name} ${saleCreator.last_name}:`, emailError);
          }
        }
      }
    }

    // Actualizar campos específicos basados en el rol
    filteredUpdatedSaleData.modified_by_user_id = userId;

    const roleMap = {
      1: { superadmin_id: userId },
      2: { admin_id: userId },
      3: { executive_id: userId },
      4: { validator_id: userId },
      5: { dispatcher_id: userId },
    };

    Object.assign(filteredUpdatedSaleData, roleMap[roleId]);

    res.status(200).json({ message: 'Venta actualizada con éxito', sale });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error al actualizar la venta', error: error.message });
  }
};


export const updateSalePriority = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const roleId = req.user.role_id;
    const saleId = req.params.sale_id;

    const { is_priority } = req.body;

    const sale = await Sales.findByPk(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Verificar si el usuario tiene permisos para actualizar la venta
    if (roleId !== 1 && roleId !== 2 && roleId !== 3) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar la venta' });
    }

const updatedSaleData = {
  is_priority,
  priority_modified_by_user_id: userId,
};


await sale.update(updatedSaleData);

// Agregar registro en SaleHistory si se actualiza el is_priority a 1
if (is_priority === 1) {
  const lastSaleHistory = await SaleHistory.findOne({
    where: { sale_id: saleId },
    order: [['modification_date', 'DESC']],
  });

  const previousStatusId = lastSaleHistory ? lastSaleHistory.new_status_id : sale.sale_status_id;
  const newStatusId = lastSaleHistory ? lastSaleHistory.new_status_id : sale.sale_status_id;

  await SaleHistory.create({
    sale_id: saleId,
    previous_status_id: previousStatusId,
    new_status_id: newStatusId,
    sale_status_reason_id: null,
    priority_modified_by_user_id: userId,
    modification_date: getLocalDateTime(),
    is_priority: 1,
    date_type: 'Prioridad',
    date: getLocalDate()
  });
}

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
  updateSalePriority
};