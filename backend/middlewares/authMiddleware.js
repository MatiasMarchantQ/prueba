import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Role from '../models/Roles.js'

let superAdminRoleId;

const getSuperAdminRoleId = async () => {
  if (!superAdminRoleId) {
    const superAdminRole = await Role.findOne({
      where: { role_name: 'SuperAdmin' },
      attributes: ['role_id'],
    });
    if (!superAdminRole) {
      throw new Error('Rol "SuperAdmin" no encontrado');
    }
    superAdminRoleId = superAdminRole.role_id;
  }
  return superAdminRoleId;
};

export const isSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const roleId = await getSuperAdminRoleId();
    if (req.user.role_id !== roleId) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a esta ruta' });
    }

    next();
  } catch (err) {
    console.error('Error en isSuperAdmin middleware:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Verificar token y autenticar usuario
export const authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByPk(decoded.user_id);

    if (!user) {
      return res.status(401).json({ error: 'Token inválido o usuario no encontrado' });
    }

    req.user = user;  // Asignar el usuario autenticado al request
    next();
  } catch (err) {
    console.error('Error en authenticate middleware:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export default {
  authenticate,
  isSuperAdmin,
};