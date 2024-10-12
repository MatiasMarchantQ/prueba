import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import Users from '../models/Users.js';
import Role from '../models/Roles.js';
import dotenv from 'dotenv';
dotenv.config();

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Email no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const role = await Role.findOne({
      where: { role_id: user.role_id },
      attributes: ['role_id', 'role_name']
    });

    let expiresIn;
    if (rememberMe) {
      expiresIn = '7d'; // 7 días
    } else {
      expiresIn = '1h'; // 1 hora
    }

    const token = jwt.sign({
      user_id: user.user_id,
      role_id: user.role_id,
      must_change_password: user.must_change_password,
      status: user.status,
    }, process.env.SECRET_KEY, { expiresIn });

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        first_name: user.first_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const logout = async (req, res) => {
  const token = req.headers['authorization'];
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tokenValue = token.replace('Bearer ', '');

  try {
    jwt.verify(tokenValue, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    res.status(200).json({ message: 'Sesión cerrada con éxito' });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Token de autenticación inválido' });
  }
};


export const changePassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { token } = req.params;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user_id = decoded.user_id;

    const user = await Users.findOne({ where: { user_id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.must_change_password) {
      return res.status(400).json({ message: 'No es necesario cambiar la contraseña' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({ password: hashedPassword, must_change_password: 0 });

    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const token = jwt.sign({ user_id: user.user_id }, process.env.SECRET_KEY, { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
      host: 'canalisp.cl',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Hola ${user.first_name},\n\nPara recuperar tu contraseña, haz clic en el siguiente enlace: https://ventas.canalisp.cl/resetpassword/${token}\n\nSi no solicitaste esta recuperación, ignora este correo electrónico.\n\nAtentamente,\nTu equipo`
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

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await Users.findOne({ where: { user_id: decoded.user_id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({ password: hashedPassword, must_change_password: 0 });

    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export default {
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};