const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Role = require('../models/Roles');

const getAdminRoleId = async () => {
  const adminRoleId = await Role.findOne({
    where: { role_name: 'Administrador' },
    attributes: ['role_id'],
  });
  return adminRoleId.role_id;
};

exports.isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const adminRoleId = await getAdminRoleId();
  if (req.user.role_id !== adminRoleId) {
    return res.status(403).json({ message: 'No tienes permiso para acceder a esta ruta' });
  }

  next();
};

exports.isEjecutivo = async (req, res, next) => {
  const userId = req.user.user_id;
  const role = await Role.findOne({
    where: { role_id: req.user.role_id },
    attributes: ['role_name'],
  });

  if (role && role.role_name === 'Ejecutivo') {
    return next();
  }
  return res.status(403).send({ error: 'Solo los ejecutivos pueden acceder a esta ruta' });
};

exports.isConsultor = async (req, res, next) => {
  const userId = req.user.user_id;
  const role = await Role.findOne({
    where: { role_id: req.user.role_id },
    attributes: ['role_name'],
  });

  if (role && role.role_name === 'Consultor') {
    return next();
  }
  return res.status(403).send({ error: 'Solo los consultores pueden acceder a esta ruta' });
};

exports.isDespachador = async (req, res, next) => {
  const userId = req.user.user_id;
  const role = await Role.findOne({
    where: { role_id: req.user.role_id },
    attributes: ['role_name'],
  });

  if (role && role.role_name === 'Despachador') {
    return next();
  }
  return res.status(403).send({ error: 'Solo los despachadores pueden acceder a esta ruta' });
};

exports.isValidador = async (req, res, next) => {
  const userId = req.user.user_id;
  const role = await Role.findOne({
    where: { role_id: req.user.role_id },
    attributes: ['role_name'],
  });

  if (role && role.role_name === 'Validador') {
    return next();
  }
  return res.status(403).send({ error: 'Solo los validadores pueden acceder a esta ruta' });
};

exports.authenticate = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ error: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByPk(decoded.user_id);

    if (!user) {
      return res.status(401).send({ error: 'Token de autenticación no válido' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).send({ error: 'Token de autenticación no válido' });
  }
};