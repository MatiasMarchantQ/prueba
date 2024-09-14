// controllers/roleController.js
import  Role  from '../models/Roles.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
};

export default {
    getRoles,
  };