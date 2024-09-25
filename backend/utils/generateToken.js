import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/config.js';

const generateToken = (user) => {
  return jwt.sign({ user_id: user.user_id, role_id: user.role_id,  must_change_password: user.must_change_password, status: user.status }, jwtSecret, { expiresIn: '1h' });
};

export default generateToken;