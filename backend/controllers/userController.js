const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Region = require('../models/Regions');
const Commune = require('../models/Communes');
const Role = require('../models/Roles');
const { Op } = require('sequelize');

const getAdminRoleId = async () => {
  const adminRoleId = await Role.findOne({
    where: { role_name: 'Administrador' },
    attributes: ['role_id', 'role_name', 'modified_by_user_id', 'created_at', 'updated_at'],
  });
  return adminRoleId.role_id;
};

exports.getUser = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  const userId = decodedToken.user_id;

  try {
    const user = await User.findOne({ where: { user_id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User found', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.register = async (req, res) => {
  const { first_name, second_name, last_name, second_last_name, rut, email, password, phone_number, company_id, region_id, commune_id, street, number, department_office_floor, role_id, status, must_change_password } = req.body;

  try {
    const adminRoleId = await getAdminRoleId();
    if (req.user.role_id !== adminRoleId) {
      return res.status(403).json({ message: 'Solo los administradores pueden registrar usuarios' });
    }
    console.log(`Usuario que realiza la solicitud: ${req.user.role_id}`);

    const existingUser = await User.findOne({ where: { [Op.or]: [{ rut }, { email }] } });
    if (existingUser) {
      if (existingUser.rut === rut) {
        return res.status(400).json({ message: 'El RUT ya está registrado' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
    }

    const commune = await Commune.findOne({ where: { commune_id } });
    if (!commune) {
      return res.status(400).json({ message: 'Comuna no encontrada' });
    }

    if (commune.region_id !== region_id) {
      return res.status(400).json({ message: 'La comuna no pertenece a la región especificada' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      second_name,
      last_name,
      second_last_name,
      rut,
      email,
      password: hashedPassword,
      phone_number,
      company_id,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      role_id,
      status,
      must_change_password,
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'user_id',
        'first_name',
        'second_name',
        'last_name',
        'second_last_name',
        'rut',
        'email',
        'phone_number',
        'company_id',
        'region_id',
        'commune_id',
        'street',
        'number',
        'department_office_floor',
        'role_id',
        'status',
        'must_change_password',
        'created_at',
        'updated_at',
      ],
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const bearerToken = authHeader.split(' ')[1];
    if (!bearerToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    try {
      const decodedToken = await jwt.verify(bearerToken, process.env.SECRET_KEY);
      console.log(`Token: ${bearerToken}`);
      console.log(`SECRET_KEY: ${process.env.SECRET_KEY}`);
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el token pertenece al usuario que se está intentando actualizar
    try {
      const decodedToken = await jwt.verify(bearerToken, process.env.SECRET_KEY);
      if (decodedToken.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario' });
      }
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    const updates = req.body;
    if (updates.rut) {
      const existingUser = await User.findOne({ where: { rut: updates.rut, user_id: { [Op.ne]: userId } } });
      if (existingUser) {
        return res.status(400).json({ message: 'El RUT ya está registrado' });
      }
    }

    if (updates.email) {
      const existingUser = await User.findOne({ where: { email: updates.email, user_id: { [Op.ne]: userId } } });
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
    }

    if (updates.commune_id) {
      const commune = await Commune.findOne({ where: { commune_id: updates.commune_id } });
      if (!commune) {
        return res.status(400).json({ message: 'Comuna no encontrada' });
      }
      if (commune.region_id !== updates.region_id) {
        return res.status(400).json({ message: 'La comuna no pertenece a la región especificada' });
      }
    }

    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updates.password = hashedPassword;
    }

    // Verificar que el usuario autenticado tenga permiso para actualizar el usuario
    if (decodedToken.roleId !== adminRoleId) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario' });
    }

    await user.update(updates);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};