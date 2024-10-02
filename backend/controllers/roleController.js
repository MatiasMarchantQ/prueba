// controllers/roleController.js
import  Role  from '../models/Roles.js';
import { Op } from 'sequelize'; // Importar correctamente el operador

export const getRoles = async (req, res) => {
  try {
    // Obtén el role_id desde el objeto user
    const { role_id } = req.user; 

    let roles;

    if (role_id === 2) {
      // Si el role_id es 2, obtener solo los roles 2 o 3
      roles = await Role.findAll({ where: { role_id: { [Op.in]: [2, 3] } } });
    } else if (role_id === 3) {
      // Si el role_id es 3, obtener solo el role_id 3
      roles = await Role.findAll({ where: { role_id: 3 } });
    } else if (role_id === 4 || role_id === 5) {
      // Si el role_id es 4 o 5, obtener los roles 1, 2, 3 o 4
      roles = await Role.findAll({ where: { role_id: { [Op.in]: [1, 2, 3, 4, 5] } } });
    } else {
      // Obtener todos los roles si no coincide con las anteriores condiciones
      roles = await Role.findAll();
    }

    // Enviar los roles filtrados en la respuesta
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
};



export default {
    getRoles,
  };