import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import Role from '../models/Roles.js';
import { Op } from 'sequelize';

const getAdminRoleId = async () => {
  const adminRoleId = await Role.findOne({
    where: { role_name: 'SuperAdmin' },
    attributes: ['role_id', 'role_name', 'modified_by_user_id', 'created_at', 'updated_at'],
  });
  return adminRoleId.role_id;
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ message: 'Users found', users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req, res) => {
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

export const updateUser = async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const bearerToken = authHeader.split(' ')[1];
    if (!bearerToken) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    try {
      const decodedToken = await jwt.verify(bearerToken, process.env.SECRET_KEY);
      req.user = decodedToken;

      const userId = req.params.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const userFromDB = await User.findByPk(req.user.user_id);
      const userRoleId = userFromDB.role_id;

      if (userRoleId !== 1 && req.user.user_id !== parseInt(userId)) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario' });
      }

      const updates = req.body;
      updates.modified_by_user_id = decodedToken.user_id;

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

      await user.update(updates);
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

export default {
  getAllUsers,
  register,
  updateUser,
};