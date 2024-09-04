const bcrypt = require('bcrypt');
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

exports.register = async (req, res) => {
  const { first_name, second_name, last_name, second_last_name, rut, email, password, phone_number, company_id, region_id, commune_id, street, number, department_office_floor, role_id, status, must_change_password } = req.body;

  try {
    const adminRoleId = await getAdminRoleId();
    if (req.user.role_id !== adminRoleId) {
      return res.status(403).json({ message: 'Solo los administradores pueden registrar usuarios' });
    }

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