import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Role from '../models/Roles.js';

// Middleware que acepta múltiples roles
export const isAnyRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.user_id, {
        include: [{ model: Role, as: 'role' }],
      });

      if (!user || !roles.includes(user.role.role_name)) {
        return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  };
};

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
