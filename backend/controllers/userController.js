import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import Role from '../models/Roles.js';
import { Op } from 'sequelize';
import { fetchUsersWithRoles } from '../services/dataServices.js';

export const getUsersWithRoles = async (req, res) => {
  try {
    const users = await fetchUsersWithRoles();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    res.status(500).send('Internal Server Error');
  }
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

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).send({ error: 'No se encontró el usuario autenticado' });
    }
    const userData = validateUser(user);
    if (!userData) {
      return res.status(400).send({ error: 'Datos del usuario inválidos' });
    }
    res.send(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error interno del servidor' });
  }
};

function validateUser(user) {
  return user;
}

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

export const register = async (req, res) => {
  try {
    const { first_name, second_name, last_name, second_last_name, rut, email, password, phone_number, sales_channel_id, company_id, region_id, commune_id, street, number, department_office_floor, role_id } = req.body;

    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ message: 'El rol especificado no existe' });
    }

    // Verificar si el RUT ya existe
    const existingUserWithRut = await User.findOne({ where: { rut } });
    if (existingUserWithRut) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    // Verificar si el email ya existe
    const existingUserWithEmail = await User.findOne({ where: { email } });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Verificar que la comuna esté asociada a la región
    const commune = await Commune.findByPk(commune_id);
    if (!commune || commune.region_id !== region_id) {
      return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      first_name,
      second_name,
      last_name,
      second_last_name,
      rut,
      email,
      password: hashedPassword,
      phone_number,
      sales_channel_id,
      company_id,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      role_id,
      status: 1,
      must_change_password: true,
    });

    res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al registrar usuario' });
  }
};

export const registerUserByAdmin = async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { first_name, second_name, last_name, second_last_name, rut, email, password, phone_number, region_id, commune_id, street, number, department_office_floor, role_id } = req.body;
    
    // Verificar que el role_id sea válido y esté dentro de los roles permitidos
    if (![3, 4, 6].includes(role_id)) {
      return res.status(400).json({ message: 'El rol especificado no es válido. Debe ser 3, 4 o 6' });
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ message: 'El rol especificado no existe' });
    }

    // Verificar si el RUT ya existe
    const existingUserWithRut = await User.findOne({ where: { rut } });
    if (existingUserWithRut) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    // Verificar si el email ya existe
    const existingUserWithEmail = await User.findOne({ where: { email } });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Verificar que la comuna esté asociada a la región
    const commune = await Commune.findByPk(commune_id);
    if (!commune || commune.region_id !== region_id) {
      return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserData = {
      first_name,
      second_name,
      last_name,
      second_last_name,
      rut,
      email,
      password: hashedPassword,
      phone_number,
      company_id: adminUser.company_id,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      role_id,
      status: 1,
      must_change_password: true,
    };

    const newUser = await User.create(newUserData);

    res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al registrar usuario' });
  }
};

export default {
  getAllUsers,
  register,
  updateUser,
  getMe,
  registerUserByAdmin,
};