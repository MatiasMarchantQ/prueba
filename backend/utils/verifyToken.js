import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/config.js';

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

export default verifyToken;