import  SaleStatus  from "../models/SaleStatuses.js";
import SaleStatusReason from "../models/SaleStatusReason.js";

export const getSaleStatuses = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'No tienes acceso' });
    }

    const userRoleId = req.user.role.role_id; // Obtener el role_id del usuario autenticado

    let saleStatuses;

    if (userRoleId === 1 || userRoleId === 2) {
      saleStatuses = await SaleStatus.findAll();
    } else if (userRoleId === 4) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [2, 3, 4, 7]
        }
      });
    } else if (userRoleId === 5) {
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [2, 5, 6, 7]
        }
      });
    } else if (userRoleId === 3) {
      // Agregar lógica para el rol 3 (Ejecutivo)
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [1, 4] // Ejemplo: solo puede ver los estados 2 y 3
        }
      });
    } else {
      return res.status(403).json({ message: 'Access denied for this role' });
    }

    res.status(200).json(saleStatuses);
  } catch (error) {
    console.error('Error fetching sale statuses:', error);
    res.status(500).json({ message: 'Error fetching sale statuses', error: error.message });
  }
};

export const getSaleStatusesFilters = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'No tienes acceso' });
    }

    const userRoleId = req.user.role.role_id; // Obtener el role_id del usuario autenticado

    let saleStatuses;

    if (userRoleId === 1 || userRoleId === 2) {
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
      // Agregar lógica para el rol 3 (Ejecutivo)
      saleStatuses = await SaleStatus.findAll({
        where: {
          sale_status_id: [1, 4] // Ejemplo: solo puede ver los estados 2 y 3
        }
      });
    } else {
      return res.status(403).json({ message: 'Access denied for this role' });
    }

    res.status(200).json(saleStatuses);
  } catch (error) {
    console.error('Error fetching sale statuses:', error);
    res.status(500).json({ message: 'Error fetching sale statuses', error: error.message });
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
    console.error('Error fetching reasons:', error);
    res.status(500).json({ message: 'Error fetching reasons', error: error.message });
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
    console.error('Error fetching all reasons:', error);
    res.status(500).json({ message: 'Error fetching all reasons', error: error.message });
  }
};

export const createReason = async (req, res) => {
  try {
    const { reason_name, sale_status_id } = req.body;
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
      return res.status(404).json({ message: 'Reason not found' });
    }
    await reason.update({ reason_name });
    res.status(200).json(reason);
  } catch (error) {
    console.error('Error updating reason:', error);
    res.status(500).json({ message: 'Error updating reason', error: error.message });
  }
};

export const toggleReason = async (req, res) => {
  try {
    const reasonId = req.params.reasonId;
    const reason = await SaleStatusReason.findByPk(reasonId);
    if (!reason) {
      return res.status(404).json({ message: 'Reason not found' });
    }
    const isActive = reason.is_active === 1 ? 0 : 1;
    await reason.update({ is_active: isActive });
    res.status(200).json({ message: `Reason ${isActive === 1 ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('Error toggling reason active:', error);
    res.status(500).json({ message: 'Error toggling reason active', error: error.message });
  }
};