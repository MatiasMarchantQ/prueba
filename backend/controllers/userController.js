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


export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Obtén el ID del usuario autenticado
    const { first_name, second_name, last_name, second_last_name, email, phone_number, sales_channel_id, company_id, region_id, commune_id, street, number, department_office_floor, password, rut } = req.body;

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

    // Si se proporciona una nueva contraseña, hashearla
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
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
      password: hashedPassword ? hashedPassword : user.password, // Solo actualiza la contraseña si se proporciona una nueva
      rut // Actualiza el RUT si se proporciona uno nuevo
    });

    res.status(200).json({ message: 'Perfil actualizado con éxito', user });
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar perfil' });
  }
};


export const updateUserByAdmin = async (req, res) => {
  try {
    const currentUserId = req.user.user_id; // ID del usuario autenticado
    const currentUserRoleId = req.user.role_id; // Rol del usuario autenticado
    const targetUserId = req.params.id; // ID del usuario a actualizar

    // Datos a actualizar
    const { 
      first_name, second_name, last_name, second_last_name, email, phone_number, sales_channel_id, company_id, region_id, commune_id, street, number, department_office_floor, password, rut 
    } = req.body;

    // Verifica si el usuario objetivo existe
    const userToUpdate = await User.findByPk(targetUserId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Lógica para SuperAdmin
    if (currentUserRoleId === 1) { // Asumiendo que el rol de SuperAdmin es 1
      // Verifica si el nuevo email ya está en uso por otro usuario
      if (email && email !== userToUpdate.email) {
        const existingUserWithEmail = await User.findOne({ where: { email } });
        if (existingUserWithEmail) {
          return res.status(400).json({ message: 'El email ya está registrado' });
        }
      }

      // Verifica si el nuevo RUT ya está en uso por otro usuario
      if (rut && rut !== userToUpdate.rut) {
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

      // Si se proporciona una nueva contraseña, hashearla
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Actualiza los datos del usuario
      await userToUpdate.update({
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
        password: hashedPassword ? hashedPassword : userToUpdate.password, // Solo actualiza la contraseña si se proporciona una nueva
        rut // Actualiza el RUT si se proporciona uno nuevo
      });

      return res.status(200).json({ message: 'Usuario actualizado con éxito', user: userToUpdate });
    }

    // Lógica para Administrador
    if (currentUserRoleId === 2) { // Asumiendo que el rol de Administrador es 2
      if (userToUpdate.company_id !== req.user.company_id) {
        return res.status(403).json({ message: 'No tienes permisos para actualizar este usuario' });
      }

      // Verifica si el nuevo email ya está en uso por otro usuario
      if (email && email !== userToUpdate.email) {
        const existingUserWithEmail = await User.findOne({ where: { email } });
        if (existingUserWithEmail) {
          return res.status(400).json({ message: 'El email ya está registrado' });
        }
      }

      // Verifica si el nuevo RUT ya está en uso por otro usuario
      if (rut && rut !== userToUpdate.rut) {
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

      // Si se proporciona una nueva contraseña, hashearla
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Actualiza los datos del usuario
      await userToUpdate.update({
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
        password: hashedPassword ? hashedPassword : userToUpdate.password, // Solo actualiza la contraseña si se proporciona una nueva
        rut // Actualiza el RUT si se proporciona uno nuevo
      });

      return res.status(200).json({ message: 'Usuario actualizado con éxito', user: userToUpdate });
    }

    // Si el usuario no es SuperAdmin ni Administrador
    res.status(403).json({ message: 'No tienes permisos para actualizar usuarios' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
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