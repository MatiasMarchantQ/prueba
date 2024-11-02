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
      return res.status(404).json({ 
        message: 'Email no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar el estado del usuario
    if (user.status === 0) {
      return res.status(403).json({
        message: 'Su cuenta se encuentra suspendida. Comuníquese con un administrador para obtener más información.',
        error: 'ACCOUNT_SUSPENDED'
      });
    }

    const role = await Role.findOne({
      where: { role_id: user.role_id },
      attributes: ['role_id', 'role_name']
    });

    if (!role) {
      return res.status(400).json({
        message: 'Rol de usuario no encontrado',
        error: 'ROLE_NOT_FOUND'
      });
    }

    let expiresIn;
    if (rememberMe) {
      expiresIn = '2h';
    } else {
      expiresIn = '1h';
    }

    const token = jwt.sign({
      user_id: user.user_id,
      role_id: user.role_id,
      must_change_password: user.must_change_password,
      status: user.status,
    }, process.env.SECRET_KEY, { expiresIn });

    // Log para debugging
    console.log('Login exitoso para:', {
      email: user.email,
      userId: user.user_id,
      roleId: user.role_id,
      mustChangePassword: user.must_change_password
    });

    res.status(200).json({
      message: 'Login exitoso',
      error: null,
      token,
      user: {
        first_name: user.first_name,
        must_change_password: user.must_change_password,
        status: user.status
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

//Cambio de contraseña cuando entra por primera vez o le cambian su contraseña un Super(Administrador)
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
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'El enlace para cambiar la contraseña ha expirado.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

//Correo para reestablecer la contraseña
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.status === 0) {
      return res.status(403).json({ message: 'Su cuenta se encuentra suspendida. Comuníquese con un administrador para obtener más información.' });
    }

    const verificationCode = generateVerificationCode();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Generar token temporal (15 minutos)
    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.SECRET_KEY,
      { expiresIn: '15m' }
    );
    
    // Actualizar usuario y programar la eliminación automática
    await user.update({
      reset_code: verificationCode,
      reset_code_expires: expirationTime
    });

    // Programar la eliminación automática del código
    setTimeout(async () => {
      try {
        await user.update({
          reset_code: null,
          reset_code_expires: null
        });
      } catch (error) {
        console.error('Error al limpiar código expirado:', error);
      }
    }, 15 * 60 * 1000); // 15 minutos

    await sendVerificationEmail(user.email, verificationCode, token);

    res.status(200).json({
      message: 'Código de verificación enviado al correo',
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const verifyCode = async (req, res) => {
  const { token, verificationCode } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await Users.findOne({ where: { user_id: decoded.user_id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Agregar validación de usuario suspendido aquí también
    if (user.status === 0) {
      return res.status(403).json({ 
        message: ' Su cuenta se encuentra suspendida. Comuníquese con un administrador para obtener más información.' 
      });
    }

    // Verificar código y fecha de expiración
    if (user.reset_code !== verificationCode || 
        new Date() > user.reset_code_expires) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado' });
    }

    // Token de corta duración para el reseteo
    const resetToken = jwt.sign(
      { 
        user_id: user.user_id, 
        verified: true 
      },
      process.env.SECRET_KEY,
      { expiresIn: '15m' } // Cambiado a 15 minutos
    );

    // Función auxiliar para validar la expiración
    const isCodeExpired = (expirationDate) => {
      return new Date() > new Date(expirationDate);
    };

    // En verifyCode, actualizar la validación
    if (user.reset_code !== verificationCode || isCodeExpired(user.reset_code_expires)) {
      // Si el código expiró, limpiarlo automáticamente
      if (isCodeExpired(user.reset_code_expires)) {
        await user.update({
          reset_code: null,
          reset_code_expires: null
        });
      }
      return res.status(400).json({ 
        message: 'Código de verificación inválido o expirado'
      });
    }

    res.status(200).json({
      message: 'Código verificado correctamente',
      resetToken
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'El token ha expirado. Por favor, solicite un nuevo código de verificación.' 
      });
    }
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (!decoded.verified) {
      return res.status(401).json({ message: 'Debe verificar el código primero' });
    }

    const user = await Users.findOne({ where: { user_id: decoded.user_id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
     // Actualizar contraseña y limpiar campos de reseteo
    await user.update({
      password: hashedPassword,
      reset_code: null,
      reset_code_expires: null
    });

    res.status(200).json({ message: 'Contraseña restablecida con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Función para generar un código de verificación simple
function generateVerificationCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
async function sendVerificationEmail(email, verificationCode, token) {
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

  // Usar el token en el enlace
  const resetLink = `${process.env.FRONTEND_URL}/resetpassword/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de verificación para recuperación de contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Tu código de verificación es: <strong>${verificationCode}</strong></p>
        <p>Este código expirará en 15 minutos.</p>
        <p>Para cambiar tu contraseña, haz clic en el siguiente enlace:</p>
        <p>
          <a href="${resetLink}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 10px 20px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;">
            Cambiar Contraseña
          </a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p>${resetLink}</p>
        <p>Si no has solicitado este código, por favor ignora este correo.</p>
        <br>
        <p>Atentamente,<br>Tu equipo</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
}

export const requestVerificationCode = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user_id = decoded.user_id;

    const user = await Users.findOne({ where: { user_id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    
    // Almacenar el código de verificación
    user.resetCode = verificationCode;
    user.resetCodeExpires = Date.now() + 3600000; // 1 hora de expiración
    await user.save();

    // Enviar correo con el código de verificación
    await sendVerificationEmail(user.email, verificationCode, token);

    res.status(200).json({ message: 'Código de verificación enviado al correo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al enviar el código de verificación' });
  }
};

//Cambiar contraseña luego del correo


export default {
  login,
  logout,
  forgotPassword,
  verifyCode,
  resetPassword,
  changePassword,
};