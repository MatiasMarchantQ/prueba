const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Users = require('../models/Users');
const Role = require('../models/Roles');


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const role = await Role.findOne({
      where: { role_id: user.role_id },
      attributes: ['role_id', 'role_name']
    });

    const token = jwt.sign({ user_id: user.user_id, role_id: user.role_id }, process.env.SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        role_name: role.role_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const token = jwt.sign({ user_id: user.user_id }, process.env.SECRET_KEY, { expiresIn: '1h' });

    // Enviar correo electrónico con el token
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // or 'STARTTLS'
      auth: {
        user: 'noreply.ingbell@gmail.com',
        pass: 'bcagcgdiatzdyihi'
      }
    });

    const mailOptions = {
      from: 'noreply.ingbell@gmail.com',
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Hola ${user.first_name},\n\nPara recuperar tu contraseña, haz clic en el siguiente enlace: ${req.protocol}://${req.get('host')}/reset-password/${token}\n\nSi no solicitaste esta recuperación, ignora este correo electrónico.\n\nAtentamente,\nTu equipo`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al enviar correo electrónico' });
      }

      res.status(200).json({ message: 'Correo electrónico enviado con éxito' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await Users.findOne({ where: { user_id: decoded.user_id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({ password: hashedPassword });

    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};