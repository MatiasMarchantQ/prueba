import  SaleStatus  from "../models/SaleStatuses.js";
import SaleStatusReason from "../models/SaleStatusReason.js";
import { Op } from 'sequelize';

export const getSaleStatuses = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'No tienes acceso' });
    }

    const userRoleId = req.user.role.role_id;

    let saleStatuses;

    if (userRoleId === 1 || userRoleId === 2 || userRoleId === 6) {
      saleStatuses = await SaleStatus.findAll();
    } else if (userRoleId === 4) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [1, 2, 3, 4, 7]
        }
      });
    } else if (userRoleId === 5) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [2, 5, 6, 7]
        }
      });
    } else if (userRoleId === 3) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [1, 4]
        }
      });
    } else {
      return res.status(403).json({ message: 'Acceso denegado para este rol' });
    }

    res.status(200).json(saleStatuses);
  } catch (error) {
    console.error('Error obteniendo estados de venta:', error);
    res.status(500).json({ message: 'Error obteniendo estados de venta', error: error.message });
  }
};

export const getSaleStatusesFilters = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'No tienes acceso' });
    }

    const userRoleId = req.user.role.role_id;

    let saleStatuses;

    if (userRoleId === 1 || userRoleId === 2 || userRoleId === 6) {
      saleStatuses = await SaleStatus.findAll();
    } else if (userRoleId === 4) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [1, 2, 3, 4, 7]
        }
      });
    } else if (userRoleId === 5) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [2, 5, 6, 7]
        }
      });
    } else if (userRoleId === 3) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [1, 4]
        }
      });
    } else {
      return res.status(403).json({ message: 'Acceso denegado para este rol' });
    }

    res.status(200).json(saleStatuses);
  } catch (error) {
    console.error('Error obteniendo estados de venta:', error);
    res.status(500).json({ message: 'Error obteniendo estados de venta', error: error.message });
  }
};

//Motivos
export const getReasons = async (req, res) => {
  try {
    const saleStatusId = req.params.saleStatusId;
    const reasons = await SaleStatusReason.findAll({
      where: {
        sale_status_id: saleStatusId,
        is_active: 1
      },
      attributes: ['sale_status_reason_id', 'reason_name']
    });
    res.status(200).json(reasons);
  } catch (error) {
    console.error('Error obteniendo motivos:', error);
    res.status(500).json({ message: 'Error obteniendo motivos', error: error.message });
  }
};

export const getAllReasons = async (req, res) => {
  try {
    const saleStatusId = req.params.saleStatusId;
    const reasons = await SaleStatusReason.findAll({
      where: {
        sale_status_id: saleStatusId
      },
      attributes: ['sale_status_reason_id', 'reason_name', 'is_active']
    });
    res.status(200).json(reasons);
  } catch (error) {
    console.error('Error obteniendo los motivos:', error);
    res.status(500).json({ message: 'Error obteniendo los motivos', error: error.message });
  }
};

export const createReason = async (req, res) => {
  try {
    const { reason_name, sale_status_id } = req.body;

    // Verificar si el sale_status_id es 1 (no se permiten motivos)
    if (Number(sale_status_id) === 1) {
      return res.status(403).json({ message: 'No se pueden agregar motivos para este estado de venta' });
    }

    // Verificar si ya existe un motivo con el mismo nombre y estado de venta
    const existingReason = await SaleStatusReason.findOne({
      where: {
        reason_name: reason_name,
        sale_status_id: sale_status_id
      }
    });

    if (existingReason) {
      return res.status(409).json({ message: 'Ya existe un motivo con este nombre para este estado de venta' });
    }

    // Si no existe y no es el estado 1, crear el nuevo motivo
    const reason = await SaleStatusReason.create({
      reason_name,
      sale_status_id,
      has_reason: true,
      modified_by_user_id: req.user.user_id
    });

    res.status(201).json(reason);
  } catch (error) {
    console.error('Error creando motivo:', error);
    res.status(500).json({ message: 'Error creando motivo', error: error.message });
  }
};
export const updateReason = async (req, res) => {
  try {
    const reasonId = req.params.reasonId;
    const { reason_name } = req.body;
    const reason = await SaleStatusReason.findByPk(reasonId);
    if (!reason) {
      return res.status(404).json({ message: 'Motivo no encontrado' });
    }

    // Verificar si ya existe otro motivo con el mismo nombre para el mismo sale_status_id
    const existingReason = await SaleStatusReason.findOne({
      where: {
        reason_name: reason_name,
        sale_status_id: reason.sale_status_id,
        id: { [Op.ne]: reasonId }
      }
    });

    if (existingReason) {
      return res.status(409).json({ message: 'Ya existe otro motivo con este nombre para este estado de venta' });
    }

    // Si no existe duplicado, actualizar el motivo
    await reason.update({ reason_name });
    res.status(200).json(reason);
  } catch (error) {
    console.error('Error actualizando motivo:', error);
    res.status(500).json({ message: 'Error actualizando motivo', error: error.message });
  }
};

export const toggleReason = async (req, res) => {
  try {
    const reasonId = req.params.reasonId;
    const reason = await SaleStatusReason.findByPk(reasonId);
    if (!reason) {
      return res.status(404).json({ message: 'Motivo no encontrado' });
    }
    const isActive = reason.is_active === 1 ? 0 : 1;
    await reason.update({ is_active: isActive });
    res.status(200).json({ message: `Reason ${isActive === 1 ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('Error toggling reason active:', error);
    res.status(500).json({ message: 'Error toggling reason active', error: error.message });
  }
};

export const getReasonsByStatus = async (req, res) => {
  try {
    const statusesWithReasons = await SaleStatus.findAll({
      attributes: ['sale_status_id', 'status_name'],
      include: [{
        model: SaleStatusReason,
        as: 'saleStatusReasons',
        attributes: ['sale_status_reason_id', 'reason_name', 'is_active'],
      }]
    });

    res.status(200).json(statusesWithReasons);
  } catch (error) {
    console.error('Error al obtener todos los estados con motivos:', error);
    res.status(500).json({ message: 'Error al obtener todos los estados con motivos', error: error.message });
  }
};
export const addOrUpdateReason = async (req, res) => {
  try {
    const { sale_status_id, sale_status_reason_id, reason_name, is_active } = req.body;

    // Verificar si el estado existe
    const saleStatus = await SaleStatus.findByPk(sale_status_id);
    if (!saleStatus) {
      return res.status(404).json({ message: 'Estado de venta no encontrado' });
    }

    // Verificar si ya existe un motivo con el mismo nombre para este estado de venta
    const whereClause = {
      sale_status_id: sale_status_id,
      reason_name: reason_name
    };

    if (sale_status_reason_id) {
      whereClause.sale_status_reason_id = { [Op.ne]: sale_status_reason_id };
    }

    const existingReason = await SaleStatusReason.findOne({ where: whereClause });

    if (existingReason) {
      return res.status(409).json({ message: 'Ya existe un motivo de venta con este nombre para este estado' });
    }

    let saleStatusReason;

    if (sale_status_reason_id) {
      saleStatusReason = await SaleStatusReason.findByPk(sale_status_reason_id);
      if (!saleStatusReason) {
        return res.status(404).json({ message: 'Motivo de estado de venta no encontrado' });
      }

      await saleStatusReason.update({
        reason_name: reason_name,
        is_active: is_active
      });

      res.status(200).json({ message: 'Motivo de estado de venta actualizado exitosamente', saleStatusReason });
    } else {
      // Si no se proporciona un ID, creamos un nuevo motivo
      saleStatusReason = await SaleStatusReason.create({
        sale_status_id: sale_status_id,
        reason_name: reason_name,
        is_active: is_active
      });

      res.status(201).json({ message: 'Motivo de estado de venta creado exitosamente', saleStatusReason });
    }
  } catch (error) {
    console.error('Error al agregar o actualizar el motivo de estado de venta:', error);
    res.status(500).json({ message: 'Error al agregar o actualizar el motivo de estado de venta', error: error.message });
  }
};