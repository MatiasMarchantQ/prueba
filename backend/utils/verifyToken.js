const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

module.exports = verifyToken;
