import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Role from '../models/Roles.js';

const getUser = async (userId) => {
  try {
    return await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const isAnyRole = (roles) => async (req, res, next) => {
  const user = await getUser(req.user.user_id);
  if (!user || !roles.includes(user.role.role_name)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

export const authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await getUser(decoded.user_id);
    if (!user) {
      return res.status(401).json({ error: 'Token inválido o usuario no encontrado' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Error en authenticate middleware:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
};