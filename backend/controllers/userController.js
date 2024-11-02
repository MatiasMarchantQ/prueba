import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import Role from '../models/Roles.js';
import SalesChannel from '../models/SalesChannels.js';
import Company from '../models/Companies.js';
import Contract from '../models/Contract.js';
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
  const { 
    page = 1, 
    limit = 18, 
    company_id,
    sales_channel_id,
    role_id,
    status,
    search,
    sort,
    order = 'asc'
  } = req.query;
  
  const decodedSearch = search ? decodeURIComponent(search) : '';
  
  // Si no se especifica el campo de ordenamiento, se utiliza 'user_id' por defecto
  const defaultSort = 'user_id';
  const sortField = sort || defaultSort;

  try {
    const whereClause = {};
    if (company_id) whereClause.company_id = company_id;
    if (sales_channel_id) whereClause.sales_channel_id = sales_channel_id;
    if (role_id) whereClause.role_id = role_id;
    if (status) whereClause.status = status;

    if (req.user.role_id === 2) {
      whereClause.company_id = req.user.company_id;
    }

    if (decodedSearch) {
      const searchTerms = decodedSearch.split(' ');
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${decodedSearch}%` } },
        { last_name: { [Op.like]: `%${decodedSearch}%` } },
        { rut: { [Op.like]: `%${decodedSearch}%` } },
        { email: { [Op.like]: `%${decodedSearch}%` } },
        { phone_number: { [Op.like]: `%${decodedSearch}%` } },
        { street: { [Op.like]: `%${decodedSearch}%` } },
        {
          [Op.and]: [
            { first_name: { [Op.like]: `%${searchTerms[0]}%` } },
            { last_name: { [Op.like]: `%${searchTerms.slice(1).join(' ')}%` } }
          ]
        }
      ];

      // Agregar búsqueda por términos individuales
      searchTerms.forEach(term => {
        whereClause[Op.or].push(
          { first_name: { [Op.like]: `%${term}%` } },
          { last_name: { [Op.like]: `%${term}%` } }
        );
      });
    }

    const totalUsers = await User.count({ where: whereClause });
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.findAll({
      where: whereClause,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      attributes: [
        'user_id',
        'first_name',
        'last_name',
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
        },
        {
          model: Contract,
          as: 'contract',
          attributes: ['contract_name']
        }
      ],
      order: [[sortField, order === 'asc' ? 'ASC' : 'DESC']]
    });

    res.status(200).json({ 
      message: 'Users found', 
      users,
      currentPage: parseInt(page),
      totalPages,
      totalUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
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
        'last_name',
        'rut',
        'email',
        'phone_number',
        'sales_channel_id',
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
        'modified_by_user_id',
        'contract_id'
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
        },
        {
          model: Contract,
          as: 'contract',
          attributes: ['contract_name']
        }
      ]
    });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
    } else {
      res.status(200).json({ message: 'Usuario encontrado', user });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
export const getMe = async (req, res) => {
  try {
    // Buscar el usuario con todas sus relaciones necesarias
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: Contract,
          as: 'contract', // Importante: usar el mismo alias que definiste en las relaciones
          attributes: ['contract_id', 'contract_name']
        },
        // Otras relaciones que necesites...
      ]
    });

    if (!user) {
      return res.status(404).send({ error: 'No se encontró el usuario autenticado' });
    }

    // Convertir a JSON plano y validar
    const userData = validateUser(user.toJSON());
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
  if (user.role_id === 3) {
    return {
      ...user,
      contract: user.contract ? {
        contract_id: user.contract.contract_id,
        contract_name: user.contract.contract_name
      } : null
    };
  }
  return user;
}

export const register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
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
      contract_id,
    } = req.body;

    // Verificar rol
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ message: 'El rol especificado no existe' });
    }

    // Verificar RUT único
    const existingUserWithRut = await User.findOne({ where: { rut } });
    if (existingUserWithRut) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    // Verificar email único
    const existingUserWithEmail = await User.findOne({ where: { email } });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Manejar región y comuna
    let updateFields = {
      region_id: null,
      commune_id: null
    };

    if (region_id) {
      const region = await Region.findByPk(region_id);
      if (!region) {
        return res.status(400).json({ message: 'La región especificada no existe' });
      }
      updateFields.region_id = region_id;

      if (commune_id) {
        const commune = await Commune.findOne({
          where: { commune_id, region_id }
        });
        if (!commune) {
          return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
        }
        updateFields.commune_id = commune_id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      first_name,
      last_name,
      rut,
      email,
      password: hashedPassword,
      phone_number: phone_number || null, 
      sales_channel_id,
      company_id,
      ...updateFields,
      street: street || null,
      number: number || null,
      department_office_floor: department_office_floor || null,
      role_id,
      status: 1,
      must_change_password: true,
      contract_id: contract_id || null,
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
      last_name,
      rut,
      email,
      password,
      phone_number,
      sales_channel_id,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      role_id,
      contract_id,
    } = req.body;

    if (![2, 3].includes(role_id)) {
      return res.status(400).json({ message: 'El rol especificado no es válido.' });
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

    // Manejar región y comuna
    let locationFields = {
      region_id: null,
      commune_id: null
    };

    if (region_id) {
      const region = await Region.findByPk(region_id);
      if (!region) {
        return res.status(400).json({ message: 'La región especificada no existe' });
      }
      locationFields.region_id = region_id;

      if (commune_id) {
        const commune = await Commune.findOne({
          where: { commune_id, region_id }
        });
        if (!commune) {
          return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
        }
        locationFields.commune_id = commune_id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserData = {
      first_name,
      last_name,
      rut,
      email,
      password: hashedPassword,
      phone_number: phone_number || null,
      sales_channel_id,
      company_id: adminUser.company_id,
      ...locationFields,
      street: street || null,
      number: number || null,
      department_office_floor: department_office_floor || null,
      role_id,
      status: 1,
      must_change_password: true,
      contract_id,
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
    const userId = req.user.user_id;
    const { first_name, last_name, email, phone_number, region_id, commune_id, street, number, department_office_floor, rut } = req.body;

    // Busca el usuario por ID
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Objeto para almacenar los campos a actualizar
    const updateFields = {
      first_name,
      last_name,
      email,
      phone_number,
      street,
      number,
      department_office_floor,
      rut
    };

    // Verifica si se proporcionó region_id
    if (region_id) {
      const region = await Region.findByPk(region_id);
      if (!region) {
        return res.status(400).json({ message: 'Región no encontrada' });
      }
      updateFields.region_id = region_id;
    } else {
      // Si no se proporciona region_id, lo establecemos como null
      updateFields.region_id = null;
      updateFields.commune_id = null; // También eliminamos la comuna si no hay región
    }

    // Verifica si se proporcionó commune_id y si hay una región seleccionada
    if (commune_id && updateFields.region_id) {
      const commune = await Commune.findOne({
        where: {
          commune_id: commune_id,
          region_id: updateFields.region_id
        }
      });
      if (!commune) {
        return res.status(400).json({ message: 'La comuna no está asociada a la región seleccionada' });
      }
      updateFields.commune_id = commune_id;
    } else {
      // Si no se proporciona commune_id o no hay región, lo establecemos como null
      updateFields.commune_id = null;
    }

    // Actualiza el usuario
    await user.update(updateFields);

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
    const currentUserId = req.user.user_id;
    const currentUserRoleId = req.user.role_id;
    const targetUserId = req.params.id;
    const { role_id, contract_id } = req.body;

    const userToUpdate = await User.findByPk(targetUserId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updates = {};

    // Función para validar la contraseña
    const validatePassword = (password) => {
      if (password.length < 8 || password.length > 20) {
        return 'La contraseña debe tener entre 8 y 20 caracteres';
      }
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return 'La contraseña debe tener al menos una mayúscula, una minúscula y un número';
      }
      return null;
    };

    // Función para manejar region_id y commune_id
    const handleRegionAndCommune = async (updates, req) => {
      // Si se proporciona region_id
      if (req.body.hasOwnProperty('region_id')) {
        updates.region_id = req.body.region_id;
        
        // Si la región es null o vacía, también limpiamos la comuna
        if (!updates.region_id || updates.region_id === '') {
          updates.region_id = null;
          updates.commune_id = null;
          return; // Terminamos aquí si no hay región
        }
      }
    
      // Si se proporciona commune_id
      if (req.body.hasOwnProperty('commune_id')) {
        // Si la comuna es null o vacía, la establecemos como null y terminamos
        if (!req.body.commune_id || req.body.commune_id === '') {
          updates.commune_id = null;
          return;
        }
    
        // Solo validamos la asociación si tenemos tanto región como comuna
        if (updates.region_id) {
          const commune = await Commune.findOne({
            where: {
              commune_id: req.body.commune_id,
              region_id: updates.region_id
            }
          });
    
          if (!commune) {
            updates.commune_id = null; // En lugar de lanzar error, simplemente no asignamos la comuna
          } else {
            updates.commune_id = req.body.commune_id;
          }
        } else {
          updates.commune_id = null;
        }
      }
    };

    // Actualizar campos básicos
    if (req.body.first_name) updates.first_name = req.body.first_name;
    if (req.body.last_name) updates.last_name = req.body.last_name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone_number) updates.phone_number = req.body.phone_number;
    if (req.body.sales_channel_id) updates.sales_channel_id = req.body.sales_channel_id;
    if (req.body.company_id) updates.company_id = req.body.company_id;
    if (req.body.street) updates.street = req.body.street;
    if (req.body.number) updates.number = req.body.number;
    if (req.body.department_office_floor) updates.department_office_floor = req.body.department_office_floor;
    if (req.body.rut) updates.rut = req.body.rut;
    if (req.body.role_id) updates.role_id = req.body.role_id;
    if (req.body.contract_id) updates.contract_id = req.body.contract_id;

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

    if (currentUserRoleId === 1 || currentUserRoleId === 2) {
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

      if (req.body.password && req.body.password !== '') {
        const passwordError = validatePassword(req.body.password);
        if (passwordError) {
          return res.status(400).json({ message: passwordError });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        updates.password = hashedPassword;
        updates.must_change_password = true;
      }

      if (req.body.hasOwnProperty('region_id') || req.body.hasOwnProperty('commune_id')) {
        await handleRegionAndCommune(updates, req);
      }

      if (currentUserRoleId === 2 && userToUpdate.company_id !== req.user.company_id) {
        return res.status(403).json({ message: 'No tienes permisos para actualizar este usuario' });
      }

      if (role_id === 3) {
        if (!contract_id) {
          return res.status(400).json({ 
            message: 'El tipo de contrato es requerido para ejecutivos' 
          });
        }
        updates.contract_id = contract_id; // Agregar esta línea
      } else {
        updates.contract_id = null;
      }
    }

    try {
      await userToUpdate.update(updates);
      return res.status(200).json({ message: 'Usuario actualizado con éxito', user: userToUpdate });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error del servidor al actualizar usuario' });
    }
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