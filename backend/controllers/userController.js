import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import Role from '../models/Roles.js';
import SalesChannel from '../models/SalesChannels.js';
import Company from '../models/Companies.js';
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
  const { page = 1, limit = 18 } = req.query;
  try {
    const users = await User.findAll({
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      attributes: [
        'user_id',
        'first_name',
        'second_name',
        'last_name',
        'second_last_name',
        'rut',
        'email',
        'password',
        'phone_number',
        'street',
        'number',
        'department_office_floor',
        'status',
        'must_change_password',
        'created_at',
        'updated_at',
        'modified_by_user_id'
      ],
      include: [
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['channel_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name']
        },
        {
          model: Region,
          as: 'region',
          attributes: ['region_name']
        },
        {
          model: Commune,
          as: 'commune',
          attributes: ['commune_name']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['role_name']
        }
      ]
    });
    res.status(200).json({ message: 'Users found', users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  const { user_id } = req.params;
  try {
    const user = await User.findOne({
      where: { user_id },
      attributes: [
        'user_id',
        'first_name',
        'second_name',
        'last_name',
        'second_last_name',
        'rut',
        'email',
        'password',
        'phone_number',
        'street',
        'number',
        'department_office_floor',
        'status',
        'must_change_password',
        'created_at',
        'updated_at',
        'modified_by_user_id'
      ],
      include: [
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['channel_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name']
        },
        {
          model: Region,
          as: 'region',
          attributes: ['region_name']
        },
        {
          model: Commune,
          as: 'commune',
          attributes: ['commune_name']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['role_name']
        }
      ]
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(200).json({ message: 'User found', user });
    }
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

export const register = async (req, res) => {
  try {
    const {
      first_name,
      second_name,
      last_name,
      second_last_name,
      rut,
      email,
      password,
      phone_number,
      sales_channel_id,
      company_id,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      role_id,
    } = req.body;

    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ message: 'El rol especificado no existe' });
    }

    const existingUserWithRut = await User.findOne({ where: { rut } });
    if (existingUserWithRut) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    const existingUserWithEmail = await User.findOne({ where: { email } });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

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

    const {
      first_name,
      second_name,
      last_name,
      second_last_name,
      rut,
      email,
      password,
      phone_number,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      role_id,
    } = req.body;

    if (![3, 4, 6].includes(role_id)) {
      return res.status(400).json({ message: 'El rol especificado no es válido. Debe ser 3, 4 o 6' });
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ message: 'El rol especificado no existe' });
    }

    const existingUserWithRut = await User.findOne({ where: { rut } });
    if (existingUserWithRut) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    const existingUserWithEmail = await User.findOne({ where: { email } });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

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


export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Obtén el ID del usuario autenticado
    const { first_name, second_name, last_name, second_last_name, email, phone_number, sales_channel_id, company_id, region_id, commune_id, street, number, department_office_floor, rut } = req.body;

    // Busca el usuario por ID
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verifica si el nuevo email ya está en uso por otro usuario
    if (email && email !== user.email) {
      const existingUserWithEmail = await User.findOne({ where: { email } });
      if (existingUserWithEmail) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
    }

    // Verifica si el nuevo RUT ya está en uso por otro usuario
    if (rut && rut !== user.rut) {
      const existingUserWithRut = await User.findOne({ where: { rut } });
      if (existingUserWithRut) {
        return res.status(400).json({ message: 'El RUT ya está registrado' });
      }
    }

    // Verifica que la comuna esté asociada a la región
    if (commune_id) {
      const commune = await Commune.findByPk(commune_id);
      if (!commune || commune.region_id !== region_id) {
        return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
      }
    }

    // Actualiza los datos del usuario
    await user.update({
      first_name,
      second_name,
      last_name,
      second_last_name,
      email,
      phone_number,
      sales_channel_id,
      company_id,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      rut // Actualiza el RUT si se proporciona uno nuevo
    });

    res.status(200).json({ message: 'Perfil actualizado con éxito', user });
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar perfil' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Debes proporcionar la contraseña actual, la nueva contraseña y confirmar la nueva contraseña' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'La nueva contraseña y la confirmación no coinciden' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'La contraseña actual no es correcta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al cambiar la contraseña' });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const currentUserId = req.user.user_id; // ID del usuario que realiza la actualización
    const currentUserRoleId = req.user.role_id;
    const targetUserId = req.params.id;

    const userToUpdate = await User.findByPk(targetUserId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updates = {};

    if (req.body.first_name) updates.first_name = req.body.first_name;
    if (req.body.second_name) updates.second_name = req.body.second_name;
    if (req.body.last_name) updates.last_name = req.body.last_name;
    if (req.body.second_last_name) updates.second_last_name = req.body.second_last_name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone_number) updates.phone_number = req.body.phone_number;
    if (req.body.sales_channel_id) updates.sales_channel_id = req.body.sales_channel_id;
    if (req.body.company_id) updates.company_id = req.body.company_id;
    if (req.body.region_id) updates.region_id = req.body.region_id;
    if (req.body.commune_id) updates.commune_id = req.body.commune_id;
    if (req.body.street) updates.street = req.body.street;
    if (req.body.number) updates.number = req.body.number;
    if (req.body.department_office_floor) updates.department_office_floor = req.body.department_office_floor;
    if (req.body.rut) updates.rut = req.body.rut;
    if (req.body.role_id) {
      updates.role_id = req.body.role_id;
    }

    // Convertir status a número
    if (typeof req.body.status !== 'undefined') {
      const statusValue = Number(req.body.status);
      if (![0, 1].includes(statusValue)) {
        return res.status(400).json({ message: 'El estado debe ser 0 o 1' });
      }
      updates.status = statusValue;
    }

    // Almacenar el userId que realiza la actualización
    updates.modified_by_user_id = currentUserId;

    if (currentUserRoleId === 1) { // SuperAdmin
      if (updates.email && updates.email !== userToUpdate.email) {
        const existingUserWithEmail = await User.findOne({ where: { email: updates.email } });
        if (existingUserWithEmail) {
          return res.status(400).json({ message: 'El email ya está registrado' });
        }
      }

      if (updates.rut && updates.rut !== userToUpdate.rut) {
        const existingUserWithRut = await User.findOne({ where: { rut: updates.rut } });
        if (existingUserWithRut) {
          return res.status(400).json({ message: 'El RUT ya está registrado' });
        }
      }

      if (updates.commune_id) {
        const commune = await Commune.findByPk(updates.commune_id);
        if (!commune || commune.region_id !== updates.region_id) {
          return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
        }
      }

      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        updates.password = hashedPassword;
      }
    }

    if (currentUserRoleId === 2) { // Administrador
      if (userToUpdate.company_id !== req.user.company_id) {
        return res.status(403).json({ message: 'No tienes permisos para actualizar este usuario' });
      }

      if (updates.email && updates.email !== userToUpdate.email) {
        const existingUserWithEmail = await User.findOne({ where: { email: updates.email } });
        if (existingUserWithEmail) {
          return res.status(400).json({ message: 'El email ya está registrado' });
        }
      }

      if (updates.rut && updates.rut !== userToUpdate.rut) {
        const existingUserWithRut = await User.findOne({ where: { rut: updates.rut } });
        if (existingUserWithRut) {
          return res.status(400).json({ message: 'El RUT ya está registrado' });
        }
      }

      if (updates.commune_id) {
        const commune = await Commune.findByPk(updates.commune_id);
        if (!commune || commune.region_id !== updates.region_id) {
          return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
        }
      }

      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        updates.password = hashedPassword;
      }
    }

    await userToUpdate.update(updates);

    return res.status(200).json({ message: 'Usuario actualizado con éxito', user: userToUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al actualizar usuario' });
  }
};


export default {
  getAllUsers,
  register,
  updateMyProfile,
  updateUserByAdmin,
  getMe,
  registerUserByAdmin,
};