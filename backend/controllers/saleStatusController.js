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
          sale_status_id: [5, 6, 7]
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

export const getReasons = async (req, res) => {
  try {
    const saleStatusId = req.params.saleStatusId;
    const reasons = await SaleStatusReason.findAll({
      where: {
        sale_status_id: saleStatusId
      },
      attributes: ['sale_status_reason_id', 'reason_name']
    });
    res.status(200).json(reasons);
  } catch (error) {
    console.error('Error fetching reasons:', error);
    res.status(500).json({ message: 'Error fetching reasons', error: error.message });
  }
};